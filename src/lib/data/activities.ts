import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, NewActivity } from "@/types/crm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { demoFetch, demoFetchOrNull } from "./demo-fetch";

type Client = SupabaseClient | null;

export async function listActivities(supabase: Client): Promise<Activity[]> {
  if (!isSupabaseConfigured || !supabase) return demoFetch<Activity[]>("/api/demo/activities");
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data as Activity[];
}

export async function createActivity(supabase: Client, input: NewActivity): Promise<Activity> {
  if (!isSupabaseConfigured || !supabase) {
    return demoFetch<Activity>("/api/demo/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("activities")
    .insert({ ...input, user_id: user!.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as Activity;
}

export async function completeActivity(
  supabase: Client,
  id: string,
  completed: boolean,
): Promise<Activity | null> {
  if (!isSupabaseConfigured || !supabase) {
    return demoFetchOrNull<Activity>(`/api/demo/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  }
  const { data, error } = await supabase
    .from("activities")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Activity;
}
