"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string, d = NaN) => { const n = parseInt(text(fd, k), 10); return Number.isFinite(n) ? n : d; };
const enc = encodeURIComponent;

// ---------- Clients ----------
export async function saveCustomer(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const id = text(fd, "id");
  const back = id ? `/dashboard/clients/${id}` : "/dashboard/clients";
  const name = text(fd, "name");
  if (name.length < 2) redirect(`${back}?err=${enc("Le nom est obligatoire.")}`);
  const row = { name, phone: text(fd, "phone") || null, email: text(fd, "email") || null, notes: text(fd, "notes") || null };
  const { error } = id
    ? await supabase.from("customers").update(row).eq("id", id).eq("tenant_id", tenant.id)
    : await supabase.from("customers").insert({ ...row, tenant_id: tenant.id });
  revalidatePath("/dashboard", "layout");
  if (error)
    redirect(`${back}?err=${enc(error.code === "23505" ? "Un client avec ce numéro existe déjà." : error.message)}`);
  redirect(id ? `/dashboard/clients/${id}?ok=1` : "/dashboard/clients?ok=1");
}

// ---------- Codes promo ----------
export async function savePromo(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const code = text(fd, "code").toUpperCase().replace(/\s+/g, "");
  const kind = text(fd, "kind") === "fixed" ? "fixed" : "percent";
  const value = num(fd, "value");
  const minOrder = num(fd, "min_order_fcfa", 0);
  const maxUses = num(fd, "max_uses");
  const expires = text(fd, "expires");
  const back = "/dashboard/promos";
  if (code.length < 3) redirect(`${back}?err=${enc("Le code doit faire au moins 3 caractères (ex : BIENVENUE10).")}`);
  if (!(value > 0)) redirect(`${back}?err=${enc("La valeur de la réduction doit être supérieure à 0.")}`);
  if (kind === "percent" && value > 100) redirect(`${back}?err=${enc("Un pourcentage ne peut pas dépasser 100.")}`);
  const { error } = await supabase.from("promo_codes").insert({
    tenant_id: tenant.id, code, kind, value, min_order_fcfa: Math.max(0, minOrder),
    max_uses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
    expires_at: expires ? `${expires}T23:59:59Z` : null,
  });
  if (error) redirect(`${back}?err=${enc(error.code === "23505" ? "Ce code existe déjà." : error.message)}`);
  revalidatePath("/dashboard/promos");
  redirect(`${back}?ok=1`);
}

export async function togglePromo(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  await supabase.from("promo_codes").update({ is_active: text(fd, "active") === "true" })
    .eq("id", text(fd, "id")).eq("tenant_id", tenant.id);
  revalidatePath("/dashboard/promos");
  redirect("/dashboard/promos");
}

export async function deletePromo(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  await supabase.from("promo_codes").delete().eq("id", text(fd, "id")).eq("tenant_id", tenant.id);
  revalidatePath("/dashboard/promos");
  redirect("/dashboard/promos");
}

// ---------- Caisse ----------
export type SaleInput = {
  items: { productId?: string; serviceId?: string; name: string; price: number; qty: number }[];
  payment: string; received?: number | null;
  customerName?: string; customerPhone?: string;
  discount?: number; promo?: string; note?: string;
};

export async function createSale(input: SaleInput): Promise<{ error: string } | void> {
  const { tenant, supabase } = await requireMember();
  const { data, error } = await supabase.rpc("create_sale", {
    p_tenant: tenant.id,
    p_items: (input.items ?? []).map((i) => ({
      product_id: i.productId ?? null, service_id: i.serviceId ?? null,
      name: i.name, price: Math.round(i.price), quantity: Math.round(i.qty),
    })),
    p_payment: input.payment,
    p_received: input.received != null && Number.isFinite(input.received) ? Math.round(input.received) : null,
    p_customer_name: input.customerName || null,
    p_customer_phone: input.customerPhone || null,
    p_discount: Math.max(0, Math.round(input.discount || 0)),
    p_promo: input.promo?.trim() || null,
    p_note: input.note?.trim() || null,
  });
  if (error || !data) return { error: error?.message ?? "La vente n'a pas pu être enregistrée." };
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/ventes/${data}?nouveau=1`);
}

export async function refundSale(fd: FormData) {
  const { supabase } = await requireMember();
  const id = text(fd, "id");
  const { error } = await supabase.rpc("refund_sale", { p_sale: id });
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/ventes/${id}${error ? `?err=${enc(error.message)}` : "?rembourse=1"}`);
}

export async function saveReceiptSettings(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  await supabase.from("tenant_settings").update({ receipt_footer: text(fd, "receipt_footer") || null })
    .eq("tenant_id", tenant.id);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/ventes?ok=1");
}
