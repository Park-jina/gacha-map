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
  // invalid UUID (22P02)는 "없는 id" 로 취급해 notFound() 가 뜨도록.
  if (error) {
    if (error.code === "22P02") return null;
    throw error;
  }
  return data;
}
