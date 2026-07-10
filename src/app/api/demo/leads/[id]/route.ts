import { NextResponse } from "next/server";
import { mockDb } from "@/lib/data/mock-store";
import type { Lead } from "@/types/crm";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = mockDb.getLead(id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = (await request.json()) as Partial<Lead>;
  const updated = mockDb.updateLead(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
