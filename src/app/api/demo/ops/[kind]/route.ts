import { NextResponse } from "next/server";
import { collectionFor } from "../collections";

type Ctx = { params: Promise<{ kind: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const c = collectionFor((await params).kind);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(c.list());
}

export async function POST(request: Request, { params }: Ctx) {
  const c = collectionFor((await params).kind);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(c.create((await request.json()) as never));
}
