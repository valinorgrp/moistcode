import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewQuote, Quote } from "@/types/crm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { demoFetch, demoFetchOrNull } from "./demo-fetch";

type Client = SupabaseClient | null;

export async function listQuotes(supabase: Client): Promise<Quote[]> {
  if (!isSupabaseConfigured || !supabase) return demoFetch<Quote[]>("/api/demo/quotes");
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Quote[];
}

export async function createQuote(supabase: Client, input: NewQuote): Promise<Quote> {
  if (!isSupabaseConfigured || !supabase) {
    return demoFetch<Quote>("/api/demo/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("quotes")
    .insert({ ...input, user_id: user!.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as Quote;
}

export async function updateQuote(
  supabase: Client,
  id: string,
  patch: Partial<Quote>,
): Promise<Quote | null> {
  if (!isSupabaseConfigured || !supabase) {
    return demoFetchOrNull<Quote>(`/api/demo/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }
  const { data, error } = await supabase
    .from("quotes")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Quote;
}
