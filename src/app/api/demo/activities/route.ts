import { NextResponse } from "next/server";
import { mockDb } from "@/lib/data/mock-store";
import type { NewActivity } from "@/types/crm";

export async function GET() {
  return NextResponse.json(mockDb.listActivities());
}

export async function POST(request: Request) {
  const input = (await request.json()) as NewActivity;
  return NextResponse.json(mockDb.createActivity(input));
}
