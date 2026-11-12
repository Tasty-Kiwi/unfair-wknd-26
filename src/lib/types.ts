export interface Supplier {
  id: string;
  name: string;
  region: string;
  leadTimeDays: number;
}
export interface Component {
  id: string;
  name: string;
  unit: string;
  supplierId: string;
}
export interface BomLine {
  componentId: string;
  quantity: number;
}
export interface Product {
  id: string;
  name: string;
  sku: string;
  bom: BomLine[];
}
export interface Inventory {
  componentId: string;
  quantity: number;
}
export interface Delivery {
  id: string;
  supplierId: string;
  componentId: string;
  quantity: number;
  availableDate: string;
}
export interface CustomerOrder {
  id: string;
  customer: string;
  productId: string;
  quantity: number;
  requiredDate: string;
  value: number;
}
export interface AlternativeSupply {
  id: string;
  name: string;
  supplierId: string;
  componentId: string;
  quantity: number;
  availableDate: string;
  approved: boolean;
  approvedProductIds: string[];
}
export interface Dataset {
  name: string;
  asOf: string;
  suppliers: Supplier[];
  components: Component[];
  products: Product[];
  inventory: Inventory[];
  deliveries: Delivery[];
  orders: CustomerOrder[];
  alternatives: AlternativeSupply[];
}
export interface Scenario {
  id: string;
  name: string;
  deliveryOverrides: {
    deliveryId: string;
    availableDate: string;
    quantity: number;
  }[];
  alternatives: {
    alternativeId: string;
    quantity: number;
    availableDate: string;
  }[];
}
export interface Allocation {
  sourceId: string;
  sourceType: "inventory" | "delivery" | "alternative";
  quantity: number;
  availableDate: string;
  supplierId?: string;
}
export interface MaterialLine {
  componentId: string;
  required: number;
  allocated: number;
  shortage: number;
  allocations: Allocation[];
  lateDeliveries: Delivery[];
}
export interface OrderResult {
  orderId: string;
  productId: string;
  requiredDate: string;
  status: "covered" | "at-risk";
  lines: MaterialLine[];
}
export interface SimulationResult {
  orders: OrderResult[];
  deliveries: Delivery[];
  summary: {
    totalOrders: number;
    atRiskOrders: number;
    missingUnits: number;
    affectedProducts: number;
    affectedComponents: number;
    atRiskValue: number;
    totalValue: number;
  };
}
