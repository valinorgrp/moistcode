import { beforeEach, describe, expect, it, vi } from "vitest";

const { listJobs, createJob, listOrders } = vi.hoisted(() => ({
  listJobs: vi.fn(),
  createJob: vi.fn(),
  listOrders: vi.fn(),
}));

// Hermetic: never touch the JSON file on disk.
vi.mock("@/lib/data/ops-store", () => ({
  opsDb: { listJobs, createJob, listOrders, listTeam: vi.fn(() => []) },
}));

import { GET, POST } from "./route";
import { PATCH } from "./[id]/route";

const ctx = (kind: string) => ({ params: Promise.resolve({ kind }) });

describe("/api/demo/ops/[kind]", () => {
  beforeEach(() => {
    listJobs.mockReset();
    createJob.mockReset();
    listOrders.mockReset();
  });

  it("lists the requested collection", async () => {
    listJobs.mockReturnValue([{ id: "j1" }]);
    const res = await GET(new Request("http://localhost/api/demo/ops/jobs"), ctx("jobs"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([{ id: "j1" }]);
  });

  it("404s for an unknown collection, including object prototype names", async () => {
    for (const kind of ["widgets", "constructor", "__proto__", "toString"]) {
      const res = await GET(new Request(`http://localhost/api/demo/ops/${kind}`), ctx(kind));
      expect(res.status).toBe(404);
    }
  });

  it("creates from the request body", async () => {
    createJob.mockImplementation((body) => ({ id: "new", ...body }));
    const res = await POST(
      new Request("http://localhost/api/demo/ops/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customer: "Moyer Packing" }),
      }),
      ctx("jobs"),
    );
    expect(createJob).toHaveBeenCalledWith({ customer: "Moyer Packing" });
    await expect(res.json()).resolves.toMatchObject({ id: "new", customer: "Moyer Packing" });
  });

  it("404s when patching an unknown collection", async () => {
    const res = await PATCH(new Request("http://localhost/x", { method: "PATCH", body: "{}" }), {
      params: Promise.resolve({ kind: "widgets", id: "1" }),
    });
    expect(res.status).toBe(404);
  });
});
