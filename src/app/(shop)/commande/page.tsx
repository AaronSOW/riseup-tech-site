import { notFound } from "next/navigation";
import { getTenant } from "@/lib/tenant";
import CheckoutForm from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const tenant = await getTenant();
  if (!tenant) notFound();
  const s = tenant.tenant_settings;
  const methods: { id: string; label: string }[] = [];
  if (s.wave_enabled && s.wave_payment_link) methods.push({ id: "wave", label: "Wave" });
  if (s.orange_money_enabled && s.orange_money_payment_link) methods.push({ id: "orange_money", label: "Orange Money" });
  if (s.cash_on_delivery_enabled) methods.push({ id: "cash_on_delivery", label: "Paiement à la livraison" });
  if (s.whatsapp_order_enabled && s.whatsapp) methods.push({ id: "whatsapp", label: "Commander par WhatsApp" });
  return <CheckoutForm methods={methods} whatsapp={s.whatsapp} shopName={tenant.name} promoEnabled={s.promo_enabled === true} />;
}
