import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const OWNER_EMAIL = process.env.CRM_OWNER_EMAIL || "phil@valinorgrpllc.com";

export async function POST(request: Request) {
  const secret = request.headers.get("x-lead-intake-secret");
  if (!process.env.LEAD_INTAKE_SECRET || secret !== process.env.LEAD_INTAKE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "CRM database is not configured" }, { status: 500 });
  }

  const { data: userList, error: userError } = await admin.auth.admin.listUsers();
  if (userError) {
    console.error("Lead intake: failed to look up CRM owner:", userError);
    return NextResponse.json({ error: "Owner lookup failed" }, { status: 500 });
  }

  const owner = userList.users.find(
    (u) => u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase(),
  );
  if (!owner) {
    console.error(`Lead intake: no CRM user found for owner email ${OWNER_EMAIL}`);
    return NextResponse.json({ error: "Owner not found" }, { status: 500 });
  }

  const notes = [
    typeof body.message === "string" && body.message.trim() ? body.message.trim() : null,
    body.preferCall ? "Prefers a call back." : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { error: insertError } = await admin.from("leads").insert({
    user_id: owner.id,
    name: body.name.trim(),
    company:
      typeof body.company === "string" && body.company.trim() ? body.company.trim() : null,
    email: typeof body.email === "string" && body.email.trim() ? body.email.trim() : null,
    phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
    status: "new",
    value: 0,
    source: typeof body.source === "string" && body.source.trim() ? body.source.trim() : "Website",
    notes: notes || null,
  });

  if (insertError) {
    console.error("Lead intake: failed to insert lead:", insertError);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
