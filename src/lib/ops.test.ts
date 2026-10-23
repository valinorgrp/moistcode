import { describe, expect, it } from "vitest";
import type { Job, Order } from "@/types/crm";
import {
  filterOrders,
  formatShortTime,
  isOrderPastDue,
  jobsForDay,
  nextNumber,
  nowLineIndex,
  orderBalance,
  orderTotals,
  roleCanEditRecords,
  roleCanManageTeam,
  roleCanUpdateJobStatus,
  shiftDateKey,
  techDayStatus,
  timeToMinutes,
} from "./ops";

const order = (o: Partial<Order>): Order => ({
  id: o.id ?? "o",
  workspace_id: "w",
  user_id: null,
  order_number: null,
  lead_id: null,
  quote_id: null,
  customer: "C",
  due_date: null,
  status: "confirmed",
  total: 0,
  paid: 0,
  notes: null,
  created_at: "",
  updated_at: "",
  ...o,
});

const job = (j: Partial<Job>): Job => ({
  id: j.id ?? "j",
  workspace_id: "w",
  user_id: null,
  job_number: null,
  order_id: null,
  lead_id: null,
  customer: "C",
  title: null,
  tech_id: "t1",
  scheduled_date: "2026-10-23",
  start_time: "09:00",
  duration_hours: 1,
  status: "scheduled",
  notes: null,
  created_at: "",
  updated_at: "",
  ...j,
});

describe("dates and times", () => {
  it("shifts a date key across month ends", () => {
    expect(shiftDateKey("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("parses HH:MM and HH:MM:SS", () => {
    expect(timeToMinutes("13:30")).toBe(810);
    expect(timeToMinutes("08:05:00")).toBe(485);
    expect(timeToMinutes(null)).toBeNull();
  });

  it("formats short times", () => {
    expect(formatShortTime("08:00")).toBe("8a");
    expect(formatShortTime("13:30:00")).toBe("1:30p");
    expect(formatShortTime("00:15")).toBe("12:15a");
    expect(formatShortTime("12:00")).toBe("12p");
  });
});

describe("orders", () => {
  it("never reports a negative balance", () => {
    expect(orderBalance({ total: 100, paid: 40 })).toBe(60);
    expect(orderBalance({ total: 100, paid: 150 })).toBe(0);
  });

  it("treats undelivered orders due before today as past due", () => {
    expect(isOrderPastDue(order({ due_date: "2026-10-20" }), "2026-10-23")).toBe(true);
    expect(isOrderPastDue(order({ due_date: "2026-10-23" }), "2026-10-23")).toBe(false);
    expect(isOrderPastDue(order({ due_date: "2026-10-20", status: "delivered" }), "2026-10-23")).toBe(false);
    expect(isOrderPastDue(order({ due_date: null }), "2026-10-23")).toBe(false);
  });

  it("filters to fulfil, past due and unpaid, past due first", () => {
    const orders = [
      order({ id: "later", due_date: "2026-10-30", total: 100 }),
      order({ id: "done-paid", status: "delivered", total: 100, paid: 100 }),
      order({ id: "done-owing", status: "delivered", total: 100, paid: 50 }),
      order({ id: "late", due_date: "2026-10-01", total: 100 }),
    ];
    const today = "2026-10-23";
    expect(filterOrders(orders, "todo", today).map((o) => o.id)).toEqual(["late", "later", "done-owing"]);
    expect(filterOrders(orders, "past_due", today).map((o) => o.id)).toEqual(["late"]);
    expect(filterOrders(orders, "unpaid", today).map((o) => o.id)).not.toContain("done-paid");
    expect(filterOrders(orders, "all", today)).toHaveLength(4);
  });

  it("totals what's owed", () => {
    expect(orderTotals([order({ total: 100, paid: 40 }), order({ total: 50, paid: 50 })])).toEqual({
      total: 150,
      paid: 90,
      owed: 60,
    });
  });

  it("numbers the next order or job", () => {
    expect(nextNumber(["O-306", "O-311", null, "O-309"], "O")).toBe("O-312");
    expect(nextNumber([], "J")).toBe("J-101");
  });
});

describe("dispatch", () => {
  const jobs = [
    job({ id: "b", start_time: "11:30" }),
    job({ id: "a", start_time: "08:00" }),
    job({ id: "other-tech", tech_id: "t2", start_time: "10:00" }),
    job({ id: "other-day", scheduled_date: "2026-10-24" }),
    job({ id: "unscheduled", tech_id: null, scheduled_date: null }),
  ];

  it("lists a day's jobs in start order, for everyone or one tech", () => {
    expect(jobsForDay(jobs, "2026-10-23").map((j) => j.id)).toEqual(["a", "other-tech", "b"]);
    expect(jobsForDay(jobs, "2026-10-23", "t1").map((j) => j.id)).toEqual(["a", "b"]);
  });

  it("places the now line before the first job that hasn't started", () => {
    const day = jobsForDay(jobs, "2026-10-23");
    expect(nowLineIndex(day, 7 * 60)).toBe(0);
    expect(nowLineIndex(day, 10 * 60 + 30)).toBe(2);
    expect(nowLineIndex(day, 23 * 60)).toBe(3);
  });

  it("summarizes a tech's day with one status", () => {
    expect(techDayStatus([])).toBe("free");
    expect(techDayStatus([job({ status: "done" }), job({ status: "late" })])).toBe("late");
    expect(techDayStatus([job({ status: "done" }), job({ status: "in_progress" })])).toBe("in_progress");
    expect(techDayStatus([job({ status: "done" }), job({ status: "done" })])).toBe("done");
    expect(techDayStatus([job({ status: "done" }), job({ status: "scheduled" })])).toBe("scheduled");
  });
});

describe("roles mirror the database rules", () => {
  it("lets owners, admins and sales edit records", () => {
    expect(["owner", "admin", "sales"].every((r) => roleCanEditRecords(r as never))).toBe(true);
    expect(roleCanEditRecords("field_tech")).toBe(false);
    expect(roleCanEditRecords("viewer")).toBe(false);
  });

  it("lets field techs update job status but not viewers", () => {
    expect(roleCanUpdateJobStatus("field_tech")).toBe(true);
    expect(roleCanUpdateJobStatus("viewer")).toBe(false);
  });

  it("limits team management to owners and admins", () => {
    expect(roleCanManageTeam("admin")).toBe(true);
    expect(roleCanManageTeam("sales")).toBe(false);
  });
});
