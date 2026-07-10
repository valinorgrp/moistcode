import { NextResponse } from "next/server";
import { mockDb } from "@/lib/data/mock-store";
import type { NewLead } from "@/types/crm";

export async function GET() {
  return NextResponse.json(mockDb.listLeads());
}

export async function POST(request: Request) {
  const input = (await request.json()) as NewLead;
  return NextResponse.json(mockDb.createLead(input));
}
