import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClient, isRateLimited } = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  isRateLimited: vi.fn(() => false),
}));

// The route only ever talks to Supabase through this factory, so mocking it
// is enough to fully isolate the route from any real external service.
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

// Real rate limiting shares in-memory state across every test in this file
// (all requests here come from the same "unknown" IP), which would trip the
// limiter once enough tests accumulate. Mock it out here; its own behavior
// is covered separately.
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited,
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

import { POST } from "./route";

const SECRET = "test-lead-intake-secret";
const OWNER_EMAIL = "phil@valinorgrpllc.com";
const ORIGINAL_ENV = { ...process.env };

function postRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/leads/inbound", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function makeAdminClient({
  users = [{ id: "owner-1", email: OWNER_EMAIL }],
  listUsersError = null as { message: string } | null,
  insertError = null as { message: string } | null,
} = {}) {
  const insert = vi.fn().mockResolvedValue({ error: insertError });
  const from = vi.fn().mockReturnValue({ insert });
  const listUsers = vi.fn().mockResolvedValue({
    data: { users },
    error: listUsersError,
  });
  return { client: { auth: { admin: { listUsers } }, from }, insert, from, listUsers };
}

describe("POST /api/leads/inbound", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, LEAD_INTAKE_SECRET: SECRET };
    delete process.env.CRM_OWNER_EMAIL;
    createAdminClient.mockReset();
    isRateLimited.mockReset();
    isRateLimited.mockReturnValue(false);
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns 429 and never touches the admin client when rate limited", async () => {
    isRateLimited.mockReturnValue(true);

    const res = await POST(
      postRequest({ name: "Jane Doe" }, { "x-lead-intake-secret": SECRET }),
    );

    expect(res.status).toBe(429);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("returns 401 when the secret header is missing", async () => {
    const res = await POST(postRequest({ name: "Jane Doe" }));

    expect(res.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("returns 401 when the secret header is wrong", async () => {
    const res = await POST(
      postRequest({ name: "Jane Doe" }, { "x-lead-intake-secret": "not-the-secret" }),
    );

    expect(res.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("returns 401 when LEAD_INTAKE_SECRET is not configured server-side, even with a header", async () => {
    delete process.env.LEAD_INTAKE_SECRET;
    const res = await POST(
      postRequest({ name: "Jane Doe" }, { "x-lead-intake-secret": "anything" }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing, with a correct secret", async () => {
    const res = await POST(postRequest({}, { "x-lead-intake-secret": SECRET }));

    expect(res.status).toBe(400);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("returns 400 when name is blank/whitespace-only", async () => {
    const res = await POST(postRequest({ name: "   " }, { "x-lead-intake-secret": SECRET }));

    expect(res.status).toBe(400);
  });

  it("returns 500 with a clear error (not a crash) when the admin client is unavailable (e.g. no SUPABASE_SERVICE_ROLE_KEY)", async () => {
    createAdminClient.mockReturnValue(null);

    const res = await POST(postRequest({ name: "Jane Doe" }, { "x-lead-intake-secret": SECRET }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(typeof json.error).toBe("string");
    expect(json.error.length).toBeGreaterThan(0);
  });

  it("resolves user_id from CRM_OWNER_EMAIL and inserts the lead with the expected shape on success", async () => {
    // route.ts reads CRM_OWNER_EMAIL once at module-load time (it's a
    // top-level const), so by the time this test runs it's already fixed to
    // the default OWNER_EMAIL — match the mocked user list to that.
    const { client, insert, from } = makeAdminClient({
      users: [{ id: "owner-42", email: OWNER_EMAIL }],
    });
    createAdminClient.mockReturnValue(client);

    const res = await POST(
      postRequest(
        {
          name: "Jane Doe",
          company: "Acme Co",
          email: "jane@acme.com",
          phone: "555-0100",
          message: "Interested in the enterprise plan.",
          preferCall: true,
          source: "Landing Page",
        },
        { "x-lead-intake-secret": SECRET },
      ),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });

    expect(from).toHaveBeenCalledWith("leads");
    expect(insert).toHaveBeenCalledWith({
      user_id: "owner-42",
      name: "Jane Doe",
      company: "Acme Co",
      email: "jane@acme.com",
      phone: "555-0100",
      status: "new",
      value: 0,
      source: "Landing Page",
      notes: "Interested in the enterprise plan.\n\nPrefers a call back.",
    });
  });

  it("defaults source to Website and leaves notes null when no message/preferCall are given", async () => {
    const { client, insert } = makeAdminClient();
    createAdminClient.mockReturnValue(client);

    const res = await POST(postRequest({ name: "Jane Doe" }, { "x-lead-intake-secret": SECRET }));

    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "Website",
        notes: null,
        company: null,
        email: null,
        phone: null,
      }),
    );
  });

  it("returns a clean 500 (not a crash) when the owner lookup fails", async () => {
    const { client } = makeAdminClient({ listUsersError: { message: "lookup failed" } });
    createAdminClient.mockReturnValue(client);

    const res = await POST(postRequest({ name: "Jane Doe" }, { "x-lead-intake-secret": SECRET }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(typeof json.error).toBe("string");
  });

  it("returns a clean 500 (not a crash) when no CRM owner user matches CRM_OWNER_EMAIL", async () => {
    const { client } = makeAdminClient({ users: [{ id: "someone-else", email: "nope@example.com" }] });
    createAdminClient.mockReturnValue(client);

    const res = await POST(postRequest({ name: "Jane Doe" }, { "x-lead-intake-secret": SECRET }));

    expect(res.status).toBe(500);
  });

  it("returns a clean 500 (not a crash) when the insert fails", async () => {
    const { client } = makeAdminClient({ insertError: { message: "insert failed" } });
    createAdminClient.mockReturnValue(client);

    const res = await POST(postRequest({ name: "Jane Doe" }, { "x-lead-intake-secret": SECRET }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(typeof json.error).toBe("string");
  });
});
