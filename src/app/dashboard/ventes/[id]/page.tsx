import Link from "next/link";
import { getAccess } from "@/lib/auth";
import { formatFcfa, whatsappLink } from "@/lib/format";
import { PAYMENT_LABEL, formatDateTime, waNumber } from "@/lib/pos";
import Receipt from "@/components/Receipt";
import PrintButton from "@/components/PrintButton";
import { refundSale } from "../../gestion/actions";

export default async function SaleReceipt({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ format?: string; nouveau?: string; err?: string; rembourse?: string }> }) {
  const { id } = await params;
  const { format, nouveau, err, rembourse } = await searchParams;
  const { tenant, supabase } = await getAccess();
  const t = tenant!;
  const { data: sale } = await supabase.from("sales").select("*").eq("id", id).eq("tenant_id", t.id).maybeSingle();
  if (!sale) return <p>Vente introuvable.</p>;
  const { data: items } = await supabase.from("sale_items").select("name,quantity,unit_price_fcfa,total_fcfa").eq("sale_id", id);

  const fmt = format === "a4" ? "a4" : "ticket";
  const s = t.tenant_settings;
  const lines = (items ?? []).map((i) => ({ name: i.name, qty: i.quantity, unit: i.unit_price_fcfa, total: i.total_fcfa }));
  const change = sale.payment_method === "cash" && sale.received_fcfa != null ? sale.received_fcfa - sale.total_fcfa : null;

  const wa = sale.customer_phone ? whatsappLink(waNumber(sale.customer_phone),
    `Reçu n°${sale.receipt_number} - ${t.name}\n${formatDateTime(sale.created_at)}\n\n` +
    lines.map((l) => `${l.qty} x ${l.name} : ${formatFcfa(l.total)}`).join("\n") +
    `\n\nTotal : ${formatFcfa(sale.total_fcfa)}\n${s.receipt_footer || "Merci de votre confiance !"}`) : null;

  return (
    <>
      <style>{`@page { size: ${fmt === "ticket" ? "80mm auto" : "A4"}; margin: ${fmt === "ticket" ? "3mm" : "12mm"}; }`}</style>
      <div className="space-y-4 print:hidden">
        <Link href="/dashboard/ventes" className="text-sm text-neutral-500">← Retour aux ventes</Link>
        {nouveau && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Vente enregistrée ✓ Vous pouvez imprimer le reçu.</p>}
        {rembourse && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Vente remboursée, les produits sont remis en stock.</p>}
        {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          <Link href={`/dashboard/ventes/${id}?format=ticket`} className={`dbtn-light ${fmt === "ticket" ? "!border-neutral-900" : ""}`}>Ticket</Link>
          <Link href={`/dashboard/ventes/${id}?format=a4`} className={`dbtn-light ${fmt === "a4" ? "!border-neutral-900" : ""}`}>Page A4</Link>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="dbtn-light">Envoyer sur WhatsApp</a>}
        </div>
      </div>

      <Receipt
        shop={{ name: t.name, logo: s.logo_url, address: s.address, phone: s.phone || s.whatsapp }}
        title={`Reçu n°${sale.receipt_number}`} date={formatDateTime(sale.created_at)}
        customer={sale.customer_name} lines={lines}
        subtotal={sale.subtotal_fcfa} discount={sale.discount_fcfa} promo={sale.promo_code} total={sale.total_fcfa}
        payment={PAYMENT_LABEL[sale.payment_method] ?? sale.payment_method}
        received={sale.received_fcfa} change={change} footer={s.receipt_footer}
        refunded={sale.status === "refunded"} format={fmt}
      />

      {sale.status === "completed" && (
        <form action={refundSale} className="print:hidden">
          <input type="hidden" name="id" value={id} />
          <button className="dbtn-danger w-full">Rembourser cette vente (remet les produits en stock)</button>
        </form>
      )}
    </>
  );
}
