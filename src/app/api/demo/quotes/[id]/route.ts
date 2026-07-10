import { NextResponse } from "next/server";
import { mockDb } from "@/lib/data/mock-store";
import type { Quote } from "@/types/crm";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = (await request.json()) as Partial<Quote>;
  const updated = mockDb.updateQuote(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
