import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("createAdminClient", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    // config.ts and admin.ts read process.env at module-evaluation time, so
    // each test needs a fresh module graph to pick up the env vars it sets.
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns null when SUPABASE_SERVICE_ROLE_KEY is not configured", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { createAdminClient } = await import("./admin");

    expect(createAdminClient()).toBeNull();
  });

  it("returns null when the Supabase URL is not configured, even with a service role key", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const { createAdminClient } = await import("./admin");

    expect(createAdminClient()).toBeNull();
  });

  it("returns a client (no network call) when both URL and service role key are configured", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const { createAdminClient } = await import("./admin");
    const client = createAdminClient();

    expect(client).not.toBeNull();
    expect(client?.auth.admin).toBeDefined();
    expect(typeof client?.from).toBe("function");
  });
});
