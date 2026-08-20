import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Lead } from "@/types/crm";

const { listLeads, createLead } = vi.hoisted(() => ({
  listLeads: vi.fn(),
  createLead: vi.fn(),
}));

// The demo store is a JSON-file-backed singleton (see mock-store.ts); mocking
// it keeps these tests hermetic and avoids touching the filesystem.
vi.mock("@/lib/data/mock-store", () => ({
  mockDb: { listLeads, createLead },
}));

import { GET, POST } from "./route";

const SAMPLE_LEAD: Lead = {
  id: "lead-1",
  user_id: "demo-user",
  name: "Dana Whitfield",
  company: "Northwind Traders",
  email: "dana@northwind.com",
  phone: "555-0110",
  status: "new",
  value: 0,
  source: "Website",
  notes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("GET /api/demo/leads", () => {
  beforeEach(() => {
    listLeads.mockReset();
    createLead.mockReset();
  });

  it("returns the leads from the mock store as JSON", async () => {
    listLeads.mockReturnValue([SAMPLE_LEAD]);

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([SAMPLE_LEAD]);
    expect(listLeads).toHaveBeenCalledTimes(1);
  });

  it("returns an empty array when there are no leads", async () => {
    listLeads.mockReturnValue([]);

    const res = await GET();

    await expect(res.json()).resolves.toEqual([]);
  });
});

describe("POST /api/demo/leads", () => {
  beforeEach(() => {
    listLeads.mockReset();
    createLead.mockReset();
  });

  it("creates a lead from the request body and returns it", async () => {
    createLead.mockReturnValue(SAMPLE_LEAD);
    const input = {
      name: "Dana Whitfield",
      company: "Northwind Traders",
      email: "dana@northwind.com",
      phone: "555-0110",
      status: "new",
      value: 0,
      source: "Website",
      notes: null,
    };

    const res = await POST(
      new Request("http://localhost/api/demo/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );

    expect(res.status).toBe(200);
    expect(createLead).toHaveBeenCalledWith(input);
    await expect(res.json()).resolves.toEqual(SAMPLE_LEAD);
  });
});
