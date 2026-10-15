import Link from "next/link";
import { getAccess } from "@/lib/auth";
import { formatDateTime } from "@/lib/pos";
import Receipt from "@/components/Receipt";
import PrintButton from "@/components/PrintButton";

const METHOD: Record<string, string> = { wave: "Wave", orange_money: "Orange Money", cash_on_delivery: "À la livraison", whatsapp: "WhatsApp" };
const PAY: Record<string, string> = { unpaid: "non payé", declared: "paiement à vérifier", paid: "payé", refunded: "remboursé" };

export default async function OrderReceipt({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ format?: string }> }) {
  const { id } = await params;
  const { format } = await searchParams;
  const { tenant, supabase } = await getAccess();
  const t = tenant!;
  const { data: o } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).eq("tenant_id", t.id).maybeSingle();
  if (!o) return <p>Commande introuvable.</p>;

  const fmt = format === "a4" ? "a4" : "ticket";
  const s = t.tenant_settings;
  const lines = (o.order_items ?? []).map((i: any) => ({
    name: i.product_name + (i.variant_label ? ` (${i.variant_label})` : ""),
    qty: i.quantity, unit: i.unit_price_fcfa, total: i.unit_price_fcfa * i.quantity,
  }));
  const subtotal = lines.reduce((x: number, l: any) => x + l.total, 0);

  return (
    <>
      <style>{`@page { size: ${fmt === "ticket" ? "80mm auto" : "A4"}; margin: ${fmt === "ticket" ? "3mm" : "12mm"}; }`}</style>
      <div className="space-y-4 print:hidden">
        <Link href="/dashboard/commandes" className="text-sm text-neutral-500">← Retour aux commandes</Link>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          <Link href={`/dashboard/commandes/${id}/recu?format=ticket`} className={`dbtn-light ${fmt === "ticket" ? "!border-neutral-900" : ""}`}>Ticket</Link>
          <Link href={`/dashboard/commandes/${id}/recu?format=a4`} className={`dbtn-light ${fmt === "a4" ? "!border-neutral-900" : ""}`}>Page A4</Link>
        </div>
      </div>
      <Receipt
        shop={{ name: t.name, logo: s.logo_url, address: s.address, phone: s.phone || s.whatsapp }}
        title={`Reçu · commande n°${o.order_number}`} date={formatDateTime(o.created_at)} customer={o.customer_name}
        lines={lines} subtotal={subtotal} discount={o.discount_fcfa ?? 0} promo={o.promo_code} total={o.total_fcfa}
        payment={`${METHOD[o.payment_method] ?? o.payment_method} (${PAY[o.payment_status] ?? o.payment_status})`}
        footer={s.receipt_footer} format={fmt}
      />
    </>
  );
}
