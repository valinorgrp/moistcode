import { opsDb } from "@/lib/data/ops-store";

/**
 * The demo-mode collections served by /api/demo/ops/[kind] and
 * /api/demo/ops/[kind]/[id]. Keeping them in one table keeps the four
 * near-identical route files from drifting apart.
 */
export const collections = {
  team: {
    list: () => opsDb.listTeam(),
    create: (body: never) => opsDb.createTeamMember(body),
    update: (id: string, body: never) => opsDb.updateTeamMember(id, body),
    remove: (id: string) => opsDb.deleteTeamMember(id),
  },
  orders: {
    list: () => opsDb.listOrders(),
    create: (body: never) => opsDb.createOrder(body),
    update: (id: string, body: never) => opsDb.updateOrder(id, body),
    remove: (id: string) => opsDb.deleteOrder(id),
  },
  jobs: {
    list: () => opsDb.listJobs(),
    create: (body: never) => opsDb.createJob(body),
    update: (id: string, body: never) => opsDb.updateJob(id, body),
    remove: (id: string) => opsDb.deleteJob(id),
  },
} as const;

export type CollectionKind = keyof typeof collections;

export function collectionFor(kind: string) {
  return Object.hasOwn(collections, kind) ? collections[kind as CollectionKind] : null;
}
