import { NextResponse } from "next/server";
import { opsDb } from "@/lib/data/ops-store";
import { TEAM_ROLES, type RolePermissions, type TeamRole } from "@/types/crm";

export async function GET() {
  return NextResponse.json(opsDb.getPermissions());
}

export async function PUT(request: Request) {
  const { role, permissions } = (await request.json()) as { role?: TeamRole; permissions?: RolePermissions };
  if (!role || !TEAM_ROLES.some((r) => r.value === role) || !permissions) {
    return NextResponse.json({ error: "role and permissions are required" }, { status: 400 });
  }
  opsDb.setPermissions(role, permissions);
  return NextResponse.json(opsDb.getPermissions());
}
