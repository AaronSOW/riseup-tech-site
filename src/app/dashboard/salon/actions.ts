"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDate, isTime } from "@/lib/booking";

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string, d = NaN) => { const n = parseInt(text(fd, k), 10); return Number.isFinite(n) ? n : d; };
const enc = encodeURIComponent;
const last = (fd: FormData, k: string) => fd.getAll(k).at(-1);

// ---------- Modules (boutique en ligne / réservations) ----------
export async function saveModules(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const { error } = await supabase.from("tenant_settings").update({
    shop_enabled: last(fd, "shop_enabled") === "true",
    booking_enabled: last(fd, "booking_enabled") === "true",
    promo_enabled: last(fd, "promo_enabled") === "true",
  }).eq("tenant_id", tenant.id);
  revalidatePath("/", "layout");
  if (error) redirect(`/dashboard/modules?err=${enc(error.message)}`);
  redirect("/dashboard/modules?ok=1");
}

// ---------- Services ----------
export async function saveService(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const id = text(fd, "id");
  const back = id ? `/dashboard/services/${id}` : "/dashboard/services/nouveau";
  const name = text(fd, "name");
  const price = num(fd, "price_fcfa");
  const duration = num(fd, "duration_minutes");
  if (name.length < 2) redirect(`${back}?err=${enc("Le nom est obligatoire.")}`);
  if (!(price >= 0)) redirect(`${back}?err=${enc("Le prix est invalide.")}`);
  if (!(duration > 0)) redirect(`${back}?err=${enc("La durée doit être supérieure à 0.")}`);

  const row = {
    tenant_id: tenant.id, name, price_fcfa: price, duration_minutes: duration,
    description: text(fd, "description") || null,
    image_url: text(fd, "image_url") || null,
    is_active: last(fd, "is_active") === "true",
  };
  const { error } = id
    ? await supabase.from("services").update(row).eq("id", id).eq("tenant_id", tenant.id)
    : await supabase.from("services").insert(row);
  revalidatePath("/", "layout");
  if (error) redirect(`${back}?err=${enc(error.message)}`);
  redirect("/dashboard/services?ok=1");
}

export async function deleteService(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const id = text(fd, "id");
  const { error } = await supabase.from("services").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/", "layout");
  if (error)
    redirect(`/dashboard/services/${id}?err=${enc("Ce service a déjà des rendez-vous : décochez « Visible » pour le masquer au lieu de le supprimer.")}`);
  redirect("/dashboard/services?ok=1");
}

// ---------- Horaires d'ouverture ----------
export async function saveHours(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const rows: { tenant_id: string; day_of_week: number; open_time: string; close_time: string }[] = [];
  for (let d = 0; d < 7; d++) {
    if (last(fd, `open_${d}`) !== "true") continue;
    for (const n of [1, 2]) {
      const a = text(fd, `from${n}_${d}`), b = text(fd, `to${n}_${d}`);
      if (!a && !b) continue;
      if (!isTime(a) || !isTime(b) || b <= a)
        redirect(`/dashboard/horaires?err=${enc("Horaires invalides : l'heure de fermeture doit être après l'ouverture.")}`);
      rows.push({ tenant_id: tenant.id, day_of_week: d, open_time: a, close_time: b });
    }
  }
  const del = await supabase.from("business_hours").delete().eq("tenant_id", tenant.id);
  if (del.error) redirect(`/dashboard/horaires?err=${enc(del.error.message)}`);
  if (rows.length) {
    const ins = await supabase.from("business_hours").insert(rows);
    if (ins.error) redirect(`/dashboard/horaires?err=${enc(ins.error.message)}`);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard/horaires?ok=1");
}

export async function saveBookingSettings(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const slot = num(fd, "booking_slot_minutes", 30);
  const patch = {
    booking_slot_minutes: [15, 30, 60].includes(slot) ? slot : 30,
    booking_capacity: Math.max(1, num(fd, "booking_capacity", 1)),
    booking_min_notice_hours: Math.max(0, num(fd, "booking_min_notice_hours", 2)),
    booking_max_days: Math.min(365, Math.max(1, num(fd, "booking_max_days", 30))),
    booking_auto_confirm: last(fd, "booking_auto_confirm") === "true",
    booking_instructions: text(fd, "booking_instructions") || null,
  };
  const { error } = await supabase.from("tenant_settings").update(patch).eq("tenant_id", tenant.id);
  revalidatePath("/", "layout");
  if (error) redirect(`/dashboard/horaires?err=${enc(error.message)}`);
  redirect("/dashboard/horaires?ok=1");
}

// ---------- Rendez-vous ----------
export async function setAppointmentStatus(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const status = text(fd, "status");
  if (!["pending", "confirmed", "cancelled", "done"].includes(status)) redirect("/dashboard/rendez-vous");
  await supabase.from("appointments").update({ status })
    .eq("id", text(fd, "id")).eq("tenant_id", tenant.id);
  revalidatePath("/dashboard", "layout");
  const back = text(fd, "back");
  redirect(back ? `/dashboard/rendez-vous?${back}` : "/dashboard/rendez-vous");
}

// Rendez-vous pris au téléphone ou au salon par le commerçant lui-même.
export async function createManualAppointment(fd: FormData) {
  const { tenant } = await requireMember();
  const back = "/dashboard/rendez-vous/nouveau";
  const date = text(fd, "date"), time = text(fd, "time");
  const name = text(fd, "name"), phone = text(fd, "phone");
  if (!isDate(date) || !isTime(time)) redirect(`${back}?err=${enc("Choisissez une date et une heure valides.")}`);
  if (name.length < 2) redirect(`${back}?err=${enc("Le nom du client est obligatoire.")}`);

  const admin = createAdminClient();
  const { data: apptId, error } = await admin.rpc("create_appointment", {
    p_tenant: tenant.id, p_service: text(fd, "service_id"), p_name: name, p_phone: phone || "-",
    p_starts: `${date}T${time}:00Z`, p_notes: text(fd, "notes") || null, p_status: "confirmed",
  });
  if (!error && apptId && phone) {
    const { data: customerId } = await admin.rpc("upsert_customer", { p_tenant: tenant.id, p_name: name, p_phone: phone });
    if (customerId) await admin.from("appointments").update({ customer_id: customerId }).eq("id", apptId);
  }
  revalidatePath("/dashboard", "layout");
  if (error) redirect(`${back}?err=${enc(error.message.includes("creneau") ? "Ce créneau est déjà complet." : error.message)}`);
  redirect("/dashboard/rendez-vous?ok=1");
}
