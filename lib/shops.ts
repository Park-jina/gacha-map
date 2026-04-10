import { supabase } from "./supabase";
import type { Shop } from "@/types/shop";

export async function fetchShops(): Promise<Shop[]> {
  const { data, error } = await supabase.from("shops").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function fetchShopById(id: string): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
