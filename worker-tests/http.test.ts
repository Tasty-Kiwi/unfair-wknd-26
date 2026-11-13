import { describe, expect, it } from "vitest";
import { readBoundedBody, readBoundedJson } from "../worker/http";

function streamed(chunks: Uint8Array[], onCancel: () => void) {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    body: new ReadableStream({
      pull(controller) {
        const chunk = chunks.shift();
        if (chunk) controller.enqueue(chunk);
        else controller.close();
      },
      cancel: onCancel,
    }),
    // Node requires this for a streaming request; the Worker receives a stream.
    duplex: "half",
  } as RequestInit);
}

describe("bounded request reader", () => {
  it("counts streamed bytes without trusting Content-Length and cancels overflow", async () => {
    let canceled = false;
    const request = streamed(
      [new Uint8Array(600_000), new Uint8Array(450_001), new Uint8Array(1)],
      () => {
        canceled = true;
      },
    );
    await expect(readBoundedBody(request, 1_050_000)).rejects.toMatchObject({
      status: 413,
    });
    expect(canceled).toBe(true);
  });
  it("counts UTF-8 bytes, accepts the exact boundary and rejects invalid encoding", async () => {
    const encoded = new TextEncoder().encode('"é"');
    expect(encoded.length).toBe(4);
    const body = () =>
      new Request("http://localhost", { method: "POST", body: encoded });
    await expect(readBoundedJson(body(), 4)).resolves.toBe("é");
    await expect(readBoundedJson(body(), 3)).rejects.toMatchObject({
      status: 413,
    });
    await expect(
      readBoundedJson(
        new Request("http://localhost", {
          method: "POST",
          body: new Uint8Array([0xff]),
        }),
        10,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
