import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead, NewLead } from "@/types/crm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { demoFetch, demoFetchOrNull } from "./demo-fetch";

type Client = SupabaseClient | null;

export async function listLeads(supabase: Client): Promise<Lead[]> {
  if (!isSupabaseConfigured || !supabase) return demoFetch<Lead[]>("/api/demo/leads");
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Lead[];
}

export async function getLead(supabase: Client, id: string): Promise<Lead | null> {
  if (!isSupabaseConfigured || !supabase) return demoFetchOrNull<Lead>(`/api/demo/leads/${id}`);
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Lead | null;
}

export async function createLead(supabase: Client, input: NewLead): Promise<Lead> {
  if (!isSupabaseConfigured || !supabase) {
    return demoFetch<Lead>("/api/demo/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("leads")
    .insert({ ...input, user_id: user!.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as Lead;
}

export async function updateLead(
  supabase: Client,
  id: string,
  patch: Partial<Lead>,
): Promise<Lead | null> {
  if (!isSupabaseConfigured || !supabase) {
    return demoFetchOrNull<Lead>(`/api/demo/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }
  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Lead;
}
