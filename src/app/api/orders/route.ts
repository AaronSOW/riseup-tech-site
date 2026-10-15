import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenant } from "@/lib/tenant";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(6).max(25),
  customerAddress: z.string().trim().max(300).optional(),
  customerNote: z.string().trim().max(500).optional(),
  promoCode: z.string().trim().max(40).optional(),
  paymentMethod: z.enum(["wave", "orange_money", "cash_on_delivery", "whatsapp"]),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(50),
    variant: z.string().max(100).optional(),
  })).min(1).max(50),
});

export async function POST(req: Request) {
  const tenant = await getTenant();
  if (!tenant || tenant.status !== "published" || tenant.tenant_settings.shop_enabled === false)
    return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
  const s = tenant.tenant_settings;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Informations invalides. Vérifiez le formulaire." }, { status: 400 });
  const d = parsed.data;

  // le moyen de paiement doit être activé pour CETTE boutique
  const allowed =
    (d.paymentMethod === "wave" && s.wave_enabled && s.wave_payment_link) ||
    (d.paymentMethod === "orange_money" && s.orange_money_enabled && s.orange_money_payment_link) ||
    (d.paymentMethod === "cash_on_delivery" && s.cash_on_delivery_enabled) ||
    (d.paymentMethod === "whatsapp" && s.whatsapp_order_enabled && s.whatsapp);
  if (!allowed) return NextResponse.json({ error: "Moyen de paiement non disponible" }, { status: 400 });

  const admin = createAdminClient();
  const ids = [...new Set(d.items.map((i) => i.productId))];
  const { data: products } = await admin.from("products").select("*")
    .in("id", ids).eq("tenant_id", tenant.id).eq("is_active", true);
  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  // les prix viennent de la base, jamais du navigateur
  let total = 0;
  const lines: any[] = [];
  const qtyByProduct = new Map<string, number>();
  for (const it of d.items) {
    const p = byId.get(it.productId);
    if (!p) return NextResponse.json({ error: "Un produit n'existe plus. Rechargez le panier." }, { status: 400 });
    qtyByProduct.set(p.id, (qtyByProduct.get(p.id) ?? 0) + it.quantity);
    lines.push({
      tenant_id: tenant.id, product_id: p.id, product_name: p.name,
      variant_label: it.variant ?? null, unit_price_fcfa: p.price_fcfa, quantity: it.quantity,
    });
    total += p.price_fcfa * it.quantity;
  }
  for (const [pid, q] of qtyByProduct) {
    const p = byId.get(pid);
    if (p.stock_status !== "available" || p.stock_quantity < q)
      return NextResponse.json({ error: `« ${p.name} » n'est plus disponible en quantité suffisante.` }, { status: 400 });
  }

  // code promo (si le commerçant les a activés) : la réduction est recalculée ici, jamais par le navigateur
  let discount = 0;
  const promo = d.promoCode && s.promo_enabled === true ? d.promoCode.toUpperCase() : null;
  if (promo) {
    const { data: disc, error: promoError } = await admin.rpc("check_promo", {
      p_tenant: tenant.id, p_code: promo, p_subtotal: total,
    });
    if (promoError) return NextResponse.json({ error: promoError.message }, { status: 400 });
    discount = Number(disc) || 0;
  }
  const finalTotal = total - discount;

  const { data: order, error } = await admin.from("orders").insert({
    tenant_id: tenant.id, customer_name: d.customerName, customer_phone: d.customerPhone,
    customer_address: d.customerAddress ?? null, customer_note: d.customerNote ?? null,
    total_fcfa: finalTotal, discount_fcfa: discount, promo_code: discount > 0 ? promo : null,
    payment_method: d.paymentMethod,
  }).select("id, order_number").single();
  if (error || !order) return NextResponse.json({ error: "Impossible d'enregistrer la commande" }, { status: 500 });

  await admin.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));

  // le code promo est consommé, et le client est ajouté (ou retrouvé) dans la liste des clients
  if (promo && discount > 0) await admin.rpc("consume_promo", { p_tenant: tenant.id, p_code: promo });
  const { data: customerId } = await admin.rpc("upsert_customer", {
    p_tenant: tenant.id, p_name: d.customerName, p_phone: d.customerPhone,
  });
  if (customerId) await admin.from("orders").update({ customer_id: customerId }).eq("id", order.id);

  // diminue le stock et l'enregistre dans l'historique des mouvements
  for (const [pid, q] of qtyByProduct) {
    const { error: stockError } = await admin.rpc("adjust_stock", {
      p_product: pid, p_change: -q, p_type: "sale_online",
      p_note: `Commande n°${order.order_number}`, p_order: order.id,
    });
    if (stockError) console.error("Stock non mis à jour :", stockError.message);
  }

  return NextResponse.json({
    orderId: order.id, orderNumber: order.order_number, total: finalTotal, discount, method: d.paymentMethod,
    paymentLink: d.paymentMethod === "wave" ? s.wave_payment_link
      : d.paymentMethod === "orange_money" ? s.orange_money_payment_link : null,
    instructions: s.payment_instructions,
  });
}
