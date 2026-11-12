import { parseDataset, parseScenario } from "./validation";
import type {
  Allocation,
  Dataset,
  Delivery,
  Scenario,
  SimulationResult,
} from "./types";

/**
 * Reserves each component independently in due-date order. Reservations are deliberately
 * not rolled back when another line on the same order is short: a partially supplied
 * multi-component order can therefore reserve scarce stock even when it is an incomplete kit.
 */
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function simulate(data: Dataset, scenario: Scenario): SimulationResult {
  const dataset = parseDataset(data);
  const plan = parseScenario(dataset, scenario);
  const overrideById = new Map(
    plan.deliveryOverrides.map((item) => [item.deliveryId, item]),
  );
  const deliveries: Delivery[] = dataset.deliveries.map((delivery) => {
    const override = overrideById.get(delivery.id);
    return override
      ? {
          ...delivery,
          availableDate: override.availableDate,
          quantity: override.quantity,
        }
      : { ...delivery };
  });
  const inventoryRemaining = new Map(
    dataset.inventory.map((item) => [item.componentId, item.quantity]),
  );
  const deliveryRemaining = new Map(
    deliveries.map((item) => [item.id, item.quantity]),
  );
  const alternativeRemaining = new Map(
    plan.alternatives.map((item) => [item.alternativeId, item.quantity]),
  );
  const productById = new Map(
    dataset.products.map((product) => [product.id, product]),
  );
  const alternativeById = new Map(
    dataset.alternatives.map((alternative) => [alternative.id, alternative]),
  );
  const orders = [...dataset.orders].sort(
    (a, b) => compare(a.requiredDate, b.requiredDate) || compare(a.id, b.id),
  );
  const results: SimulationResult["orders"] = [];

  for (const order of orders) {
    const product = productById.get(order.productId)!;
    const lines = product.bom.map((bomLine) => {
      let remaining = order.quantity * bomLine.quantity;
      const required = remaining;
      const allocations: Allocation[] = [];
      const take = (
        sourceId: string,
        sourceType: Allocation["sourceType"],
        available: number,
        date: string,
        supplierId?: string,
        reserve?: (n: number) => void,
      ) => {
        if (remaining <= 0 || available <= 0 || date > order.requiredDate)
          return;
        const quantity = Math.min(remaining, available);
        allocations.push({
          sourceId,
          sourceType,
          quantity,
          availableDate: date,
          ...(supplierId ? { supplierId } : {}),
        });
        remaining -= quantity;
        reserve?.(quantity);
      };

      take(
        `inventory:${bomLine.componentId}`,
        "inventory",
        inventoryRemaining.get(bomLine.componentId) ?? 0,
        dataset.asOf,
        undefined,
        (n) =>
          inventoryRemaining.set(
            bomLine.componentId,
            (inventoryRemaining.get(bomLine.componentId) ?? 0) - n,
          ),
      );

      const componentDeliveries = deliveries.filter(
        (delivery) => delivery.componentId === bomLine.componentId,
      );
      const sources = [
        ...componentDeliveries.map((d) => ({
          id: d.id,
          date: d.availableDate,
          supplierId: d.supplierId,
          type: "delivery" as const,
        })),
        ...plan.alternatives.flatMap((use) => {
          const alt = alternativeById.get(use.alternativeId)!;
          return alt.componentId === bomLine.componentId &&
            alt.approved &&
            alt.approvedProductIds.includes(order.productId)
            ? [
                {
                  id: alt.id,
                  date: use.availableDate,
                  supplierId: alt.supplierId,
                  type: "alternative" as const,
                },
              ]
            : [];
        }),
      ].sort(
        (a, b) =>
          compare(a.date, b.date) ||
          compare(a.id, b.id) ||
          compare(a.type, b.type),
      );
      for (const source of sources) {
        const ledger =
          source.type === "delivery" ? deliveryRemaining : alternativeRemaining;
        take(
          source.id,
          source.type,
          ledger.get(source.id) ?? 0,
          source.date,
          source.supplierId,
          (n) => ledger.set(source.id, (ledger.get(source.id) ?? 0) - n),
        );
      }

      const lateDeliveries = componentDeliveries.filter(
        (delivery) =>
          delivery.availableDate > order.requiredDate &&
          (deliveryRemaining.get(delivery.id) ?? 0) > 0,
      );
      return {
        componentId: bomLine.componentId,
        required,
        allocated: required - remaining,
        shortage: remaining,
        allocations,
        lateDeliveries,
      };
    });
    results.push({
      orderId: order.id,
      productId: order.productId,
      requiredDate: order.requiredDate,
      status: lines.every((line) => line.shortage === 0)
        ? "covered"
        : "at-risk",
      lines,
    });
  }

  const riskyIds = new Set(
    results
      .filter((order) => order.status === "at-risk")
      .map((order) => order.orderId),
  );
  const riskyOrders = dataset.orders.filter((order) => riskyIds.has(order.id));
  const riskyResults = results.filter((order) => riskyIds.has(order.orderId));
  const missingUnits = riskyResults.reduce(
    (total, order) =>
      total + order.lines.reduce((sum, line) => sum + line.shortage, 0),
    0,
  );
  const affectedComponents = new Set(
    riskyResults.flatMap((order) =>
      order.lines
        .filter((line) => line.shortage > 0)
        .map((line) => line.componentId),
    ),
  );
  const affectedProducts = new Set(
    riskyResults.map((order) => order.productId),
  );
  const totalValue = dataset.orders.reduce(
    (sum, order) => sum + order.value,
    0,
  );
  return {
    orders: results,
    deliveries,
    summary: {
      totalOrders: dataset.orders.length,
      atRiskOrders: riskyOrders.length,
      missingUnits,
      affectedProducts: affectedProducts.size,
      affectedComponents: affectedComponents.size,
      atRiskValue: riskyOrders.reduce((sum, order) => sum + order.value, 0),
      totalValue,
    },
  };
}
