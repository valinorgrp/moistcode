import { NextResponse } from "next/server";
import { mockDb } from "@/lib/data/mock-store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { completed } = (await request.json()) as { completed: boolean };
  const updated = mockDb.completeActivity(id, completed);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
