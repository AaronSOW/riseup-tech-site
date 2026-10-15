import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenant } from "@/lib/tenant";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().int().min(0).max(100000000) });

export async function POST(req: Request) {
  const tenant = await getTenant();
  if (!tenant || tenant.status !== "published" || tenant.tenant_settings.promo_enabled !== true)
    return NextResponse.json({ error: "Codes promo indisponibles" }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Code invalide" }, { status: 400 });

  const { data, error } = await createAdminClient().rpc("check_promo", {
    p_tenant: tenant.id, p_code: parsed.data.code, p_subtotal: parsed.data.subtotal,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ discount: Number(data) || 0 });
}
