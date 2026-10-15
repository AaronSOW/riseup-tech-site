"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { presetFor } from "@/lib/presets";
import { slugify } from "@/lib/format";

async function guard() {
  const a = await getAdmin();
  if (!a.ok) throw new Error("Accès refusé");
  return a;
}
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const err = (path: string, msg: string) => redirect(`${path}?error=${encodeURIComponent(msg)}`);

export async function createTenant(fd: FormData) {
  await guard();
  const name = s(fd, "name");
  const slug = slugify(s(fd, "slug") || name);
  const type = s(fd, "business_type") || "clothing";
  const email = s(fd, "email").toLowerCase();
  const password = s(fd, "password");
  const price = parseInt(s(fd, "sold_price_fcfa"), 10);
  const renewal = s(fd, "renewal_date") || null;

  if (name.length < 2) err("/admin/nouvelle", "Nom trop court");
  if (slug.length < 3) err("/admin/nouvelle", "L'adresse (slug) doit faire au moins 3 caractères");
  if (!email.includes("@")) err("/admin/nouvelle", "E-mail invalide");
  if (password.length < 8) err("/admin/nouvelle", "Mot de passe : 8 caractères minimum");

  const admin = createAdminClient();
  const { data: t, error } = await admin.from("tenants").insert({
    slug, name, business_type: type,
    sold_price_fcfa: Number.isFinite(price) ? price : null, renewal_date: renewal,
  }).select("id").single();
  if (error || !t) err("/admin/nouvelle", error?.code === "23505" ? "Cette adresse existe déjà" : (error?.message ?? "Erreur"));

  const { data: u, error: ue } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (ue || !u?.user) {
    await admin.from("tenants").delete().eq("id", t!.id);
    err("/admin/nouvelle", "Compte non créé : " + (ue?.message ?? "erreur") + " (cet e-mail existe peut-être déjà)");
  }
  await admin.from("tenant_memberships").insert({ tenant_id: t!.id, user_id: u!.user.id, role: "owner" });
  await admin.from("tenant_settings").update(presetFor(type, name)).eq("tenant_id", t!.id);
  redirect(`/admin/${t!.id}?created=1`);
}

export async function updateTenant(fd: FormData) {
  await guard();
  const id = s(fd, "id");
  const price = parseInt(s(fd, "sold_price_fcfa"), 10);
  const { error } = await createAdminClient().from("tenants").update({
    name: s(fd, "name"),
    status: s(fd, "status"),
    business_type: s(fd, "business_type"),
    sold_price_fcfa: Number.isFinite(price) ? price : null,
    renewal_date: s(fd, "renewal_date") || null,
    internal_notes: s(fd, "internal_notes") || null,
    module_pos: fd.getAll("module_pos").at(-1) === "true",
  }).eq("id", id);
  if (error) err(`/admin/${id}`, error.message);
  revalidatePath("/admin", "layout");
  redirect(`/admin/${id}?saved=1`);
}

export async function addDomain(fd: FormData) {
  await guard();
  const id = s(fd, "id");
  const domain = s(fd, "domain").toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!domain.includes(".")) err(`/admin/${id}`, "Domaine invalide");
  const { error } = await createAdminClient().from("tenant_domains").insert({ tenant_id: id, domain });
  if (error) err(`/admin/${id}`, error.code === "23505" ? "Ce domaine est déjà utilisé" : error.message);
  redirect(`/admin/${id}?saved=1`);
}

export async function removeDomain(fd: FormData) {
  await guard();
  const id = s(fd, "id");
  await createAdminClient().from("tenant_domains").delete().eq("id", s(fd, "domain_id")).eq("tenant_id", id);
  redirect(`/admin/${id}?saved=1`);
}

export async function setMerchantPassword(fd: FormData) {
  await guard();
  const id = s(fd, "id");
  const password = s(fd, "password");
  if (password.length < 8) err(`/admin/${id}`, "Mot de passe : 8 caractères minimum");
  const { error } = await createAdminClient().auth.admin.updateUserById(s(fd, "user_id"), { password });
  if (error) err(`/admin/${id}`, error.message);
  redirect(`/admin/${id}?saved=1`);
}

export async function adminLogout() {
  const { supabase } = await getAdmin();
  await supabase.auth.signOut();
  redirect("/login");
}
