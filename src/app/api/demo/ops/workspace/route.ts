import { NextResponse } from "next/server";
import { opsDb } from "@/lib/data/ops-store";

export async function GET() {
  return NextResponse.json(opsDb.getWorkspace());
}

export async function PATCH(request: Request) {
  const { name } = (await request.json()) as { name?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  opsDb.renameWorkspace(name.trim());
  return NextResponse.json(opsDb.getWorkspace());
}
