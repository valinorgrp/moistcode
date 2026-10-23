import { NextResponse } from "next/server";
import { collectionFor } from "../../collections";

type Ctx = { params: Promise<{ kind: string; id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { kind, id } = await params;
  const c = collectionFor(kind);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = c.update(id, (await request.json()) as never);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { kind, id } = await params;
  const c = collectionFor(kind);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!c.remove(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
