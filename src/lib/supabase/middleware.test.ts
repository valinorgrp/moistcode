import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

// Pretend a Supabase project *is* configured, so updateSession actually runs
// its auth check instead of short-circuiting (that path is exercised
// implicitly whenever isSupabaseConfigured is false, e.g. in local demo mode).
vi.mock("./config", () => ({
  isSupabaseConfigured: true,
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser },
  })),
}));

import { updateSession } from "./middleware";

function requestFor(path: string) {
  return new NextRequest(new URL(path, "http://localhost"));
}

function isRedirect(res: Response) {
  return res.status >= 300 && res.status < 400 && res.headers.has("location");
}

describe("updateSession (PUBLIC_PATHS)", () => {
  beforeEach(() => {
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: null } });
  });

  const publicPaths = ["/login", "/signup", "/auth/callback", "/api/leads/inbound"];

  for (const path of publicPaths) {
    it(`does not redirect ${path} when there is no session`, async () => {
      const res = await updateSession(requestFor(path));

      expect(isRedirect(res)).toBe(false);
    });
  }

  it("redirects an arbitrary protected path (/leads) to /login when there is no session", async () => {
    const res = await updateSession(requestFor("/leads"));

    expect(isRedirect(res)).toBe(true);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("also exempts nested paths under a public prefix, e.g. /auth/callback?code=... ", async () => {
    const res = await updateSession(requestFor("/auth/callback?code=abc123"));

    expect(isRedirect(res)).toBe(false);
  });

  it("redirects an authenticated user away from /login back to /", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const res = await updateSession(requestFor("/login"));

    expect(isRedirect(res)).toBe(true);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });
});
