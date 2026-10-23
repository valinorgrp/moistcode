import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, create, isRateLimited } = vi.hoisted(() => ({
  getUser: vi.fn(),
  create: vi.fn(),
  isRateLimited: vi.fn(() => false),
}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited, getClientIp: () => "1.2.3.4" }));
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create };
  },
}));

import { MAX_MESSAGE_LENGTH, POST } from "./route";

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/ai/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

describe("POST /api/ai/parse guards", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    getUser.mockReset();
    create.mockReset();
    isRateLimited.mockReset();
    isRateLimited.mockReturnValue(false);
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  });

  it("rejects signed-out callers without calling the AI", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await post({ message: "hi" });
    expect(res.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("rate-limits per signed-in user", async () => {
    isRateLimited.mockReturnValue(true);
    const res = await post({ message: "hi" });
    expect(res.status).toBe(429);
    expect(isRateLimited).toHaveBeenCalledWith("ai-parse:user:u1", expect.any(Number), expect.any(Number));
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects oversized messages", async () => {
    const res = await post({ message: "x".repeat(MAX_MESSAGE_LENGTH + 1) });
    expect(res.status).toBe(413);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects empty or malformed bodies", async () => {
    expect((await post({ message: "   " })).status).toBe(400);
    expect((await post("not json")).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
