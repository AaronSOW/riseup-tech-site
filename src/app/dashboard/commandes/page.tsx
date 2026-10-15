import { getAccess } from "@/lib/auth";
import { formatFcfa, whatsappLink } from "@/lib/format";
import { updateOrder } from "../actions";

const STATUS: Record<string, string> = { new: "Nouvelle", confirmed: "Confirmée", preparing: "En préparation", delivered: "Livrée", cancelled: "Annulée" };
const PAY: Record<string, string> = { unpaid: "Non payé", declared: "Client dit avoir payé", paid: "Payé (vérifié)", refunded: "Remboursé" };
const METHOD: Record<string, string> = { wave: "Wave", orange_money: "Orange Money", cash_on_delivery: "À la livraison", whatsapp: "WhatsApp" };

export default async function Orders() {
  const { tenant, supabase } = await getAccess();
  const { data: orders } = await supabase.from("orders").select("*, order_items(*)")
    .eq("tenant_id", tenant!.id).order("created_at", { ascending: false }).limit(100);

  return (
    <>
      <h1 className="text-2xl font-bold">Commandes</h1>
      {(orders ?? []).length === 0 && <p className="text-sm text-neutral-500">Aucune commande pour le moment.</p>}
      {(orders ?? []).map((o: any) => (
        <form key={o.id} action={updateOrder} className="dcard space-y-3">
          <input type="hidden" name="id" value={o.id} />
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">n°{o.order_number} · {o.customer_name}</p>
              <p className="text-xs text-neutral-500">{new Date(o.created_at).toLocaleString("fr-FR")} · {METHOD[o.payment_method]}</p>
            </div>
            <p className="font-bold">{formatFcfa(o.total_fcfa)}</p>
          </div>
          <ul className="text-sm text-neutral-700">
            {o.order_items.map((i: any) => <li key={i.id}>{i.quantity} × {i.product_name}{i.variant_label ? ` (${i.variant_label})` : ""}</li>)}
          </ul>
          <p className="text-sm">📞 {o.customer_phone}{o.customer_address ? ` · ${o.customer_address}` : ""}</p>
          {o.customer_note && <p className="text-sm italic">« {o.customer_note} »</p>}
          {o.payment_reference && <p className="text-sm">Référence indiquée : <strong>{o.payment_reference}</strong></p>}
          <div className="grid grid-cols-2 gap-2">
            <select name="status" defaultValue={o.status} className="field">{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select name="payment_status" defaultValue={o.payment_status} className="field">{Object.entries(PAY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          <div className="flex gap-2">
            <button className="dbtn flex-1">Enregistrer</button>
            <a className="dbtn-light" href={`/dashboard/commandes/${o.id}/recu`}>Reçu</a>
            <a className="dbtn-light" target="_blank" rel="noreferrer"
              href={whatsappLink(o.customer_phone.startsWith("+") ? o.customer_phone : "221" + o.customer_phone, `Bonjour ${o.customer_name}, au sujet de votre commande n°${o.order_number}.`)}>
              WhatsApp
            </a>
          </div>
        </form>
      ))}
    </>
  );
}
