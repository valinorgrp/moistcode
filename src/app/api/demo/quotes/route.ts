import { NextResponse } from "next/server";
import { mockDb } from "@/lib/data/mock-store";
import type { NewQuote } from "@/types/crm";

export async function GET() {
  return NextResponse.json(mockDb.listQuotes());
}

export async function POST(request: Request) {
  const input = (await request.json()) as NewQuote;
  return NextResponse.json(mockDb.createQuote(input));
}
