import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenant } from "@/lib/tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSlots, isDate, isTime } from "@/lib/booking";

const schema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().refine(isDate),
  time: z.string().refine(isTime),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(25),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  const tenant = await getTenant();
  if (!tenant || tenant.status !== "published" || tenant.tenant_settings.booking_enabled !== true)
    return NextResponse.json({ error: "Réservations indisponibles" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Informations invalides. Vérifiez le formulaire." }, { status: 400 });
  const d = parsed.data;

  const admin = createAdminClient();
  const free = await getSlots(admin, tenant.id, d.serviceId, d.date);
  if (!free.includes(d.time))
    return NextResponse.json({ error: "Ce créneau n'est plus disponible. Choisissez une autre heure." }, { status: 409 });

  const { data: id, error } = await admin.rpc("create_appointment", {
    p_tenant: tenant.id, p_service: d.serviceId, p_name: d.name, p_phone: d.phone,
    p_starts: `${d.date}T${d.time}:00Z`, p_notes: d.notes ?? null,
  });
  if (error || !id)
    return NextResponse.json({ error: "Ce créneau n'est plus disponible. Choisissez une autre heure." }, { status: 409 });

  const { data: customerId } = await admin.rpc("upsert_customer", { p_tenant: tenant.id, p_name: d.name, p_phone: d.phone });
  if (customerId) await admin.from("appointments").update({ customer_id: customerId }).eq("id", id);
  const { data: appt } = await admin.from("appointments").select("status,starts_at").eq("id", id).maybeSingle();
  const { data: svc } = await admin.from("services").select("name,price_fcfa,duration_minutes").eq("id", d.serviceId).maybeSingle();
  return NextResponse.json({
    id, status: appt?.status ?? "pending", startsAt: appt?.starts_at ?? `${d.date}T${d.time}:00Z`,
    service: svc?.name ?? "", price: svc?.price_fcfa ?? 0,
  });
}
