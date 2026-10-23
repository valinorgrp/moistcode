import { NextResponse } from "next/server";
import { opsDb } from "@/lib/data/ops-store";

export async function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("limit") ?? 25);
  const limit = Number.isFinite(raw) ? Math.min(Math.max(1, Math.floor(raw)), 200) : 25;
  return NextResponse.json(opsDb.listAudit(limit));
}
