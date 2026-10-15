import Link from "next/link";
import { getAccess } from "@/lib/auth";
import { formatFcfa, whatsappLink } from "@/lib/format";
import { PAYMENT_LABEL, formatDateTime, waNumber } from "@/lib/pos";
import { formatWhen } from "@/lib/booking";
import { saveCustomer } from "../../gestion/actions";

const ORDER_STATUS: Record<string, string> = { new: "Nouvelle", confirmed: "Confirmée", preparing: "En préparation", delivered: "Livrée", cancelled: "Annulée" };
const APPT_STATUS: Record<string, string> = { pending: "À confirmer", confirmed: "Confirmé", done: "Terminé", cancelled: "Annulé" };

export default async function CustomerPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { id } = await params;
  const { ok, err } = await searchParams;
  const { tenant, supabase } = await getAccess();
  const tid = tenant!.id;

  const { data: c } = await supabase.from("customers").select("*").eq("id", id).eq("tenant_id", tid).maybeSingle();
  if (!c) return <p>Client introuvable.</p>;

  const [{ data: orders }, { data: sales }, { data: appts }] = await Promise.all([
    supabase.from("orders").select("id,order_number,total_fcfa,status,created_at").eq("tenant_id", tid).eq("customer_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("sales").select("id,receipt_number,total_fcfa,status,payment_method,created_at").eq("tenant_id", tid).eq("customer_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("appointments").select("id,starts_at,status,services(name)").eq("tenant_id", tid).eq("customer_id", id).order("starts_at", { ascending: false }).limit(50),
  ]);

  const spent = (orders ?? []).filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total_fcfa, 0)
    + (sales ?? []).filter((s) => s.status === "completed").reduce((s, x) => s + x.total_fcfa, 0);

  return (
    <>
      <Link href="/dashboard/clients" className="text-sm text-neutral-500">← Retour aux clients</Link>
      <h1 className="text-2xl font-bold">{c.name}</h1>
      {ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Enregistré ✓</p>}
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="dcard"><p className="text-sm text-neutral-500">Total dépensé</p><p className="mt-1 text-xl font-bold">{formatFcfa(spent)}</p></div>
        <div className="dcard"><p className="text-sm text-neutral-500">Client depuis</p><p className="mt-1 text-lg font-bold">{new Date(c.created_at).toLocaleDateString("fr-FR")}</p></div>
      </div>
      {c.phone && (
        <div className="flex gap-2">
          <a href={`tel:${c.phone}`} className="dbtn-light">Appeler</a>
          <a href={whatsappLink(waNumber(c.phone), `Bonjour ${c.name}, `)} target="_blank" rel="noreferrer" className="dbtn-light">WhatsApp</a>
        </div>
      )}

      <form action={saveCustomer} className="dcard space-y-3">
        <input type="hidden" name="id" value={id} />
        <h2 className="font-semibold">Informations</h2>
        <input name="name" required minLength={2} defaultValue={c.name} className="field" />
        <input name="phone" type="tel" defaultValue={c.phone ?? ""} placeholder="Téléphone" className="field" />
        <input name="email" type="email" defaultValue={c.email ?? ""} placeholder="E-mail" className="field" />
        <textarea name="notes" rows={3} defaultValue={c.notes ?? ""} placeholder="Notes (préférences, allergies, remarques…)" className="field" />
        <button className="dbtn w-full">Enregistrer</button>
      </form>

      <div className="dcard space-y-2">
        <h2 className="font-semibold">Commandes en ligne</h2>
        {(orders ?? []).length === 0 && <p className="text-sm text-neutral-500">Aucune.</p>}
        {(orders ?? []).map((o) => (
          <Link key={o.id} href={`/dashboard/commandes/${o.id}/recu`} className="flex justify-between text-sm hover:underline">
            <span>n°{o.order_number} · {formatDateTime(o.created_at)} · {ORDER_STATUS[o.status] ?? o.status}</span>
            <strong>{formatFcfa(o.total_fcfa)}</strong>
          </Link>
        ))}
      </div>

      {tenant!.module_pos && (
        <div className="dcard space-y-2">
          <h2 className="font-semibold">Achats en magasin</h2>
          {(sales ?? []).length === 0 && <p className="text-sm text-neutral-500">Aucun.</p>}
          {(sales ?? []).map((s) => (
            <Link key={s.id} href={`/dashboard/ventes/${s.id}`} className="flex justify-between text-sm hover:underline">
              <span>Reçu n°{s.receipt_number} · {formatDateTime(s.created_at)} · {PAYMENT_LABEL[s.payment_method] ?? s.payment_method}{s.status === "refunded" ? " · remboursé" : ""}</span>
              <strong>{formatFcfa(s.total_fcfa)}</strong>
            </Link>
          ))}
        </div>
      )}

      {tenant!.tenant_settings.booking_enabled === true && (
        <div className="dcard space-y-2">
          <h2 className="font-semibold">Rendez-vous</h2>
          {(appts ?? []).length === 0 && <p className="text-sm text-neutral-500">Aucun.</p>}
          {(appts ?? []).map((a: any) => {
            const svc = Array.isArray(a.services) ? a.services[0] : a.services;
            return (
              <p key={a.id} className="flex justify-between text-sm">
                <span className="capitalize">{formatWhen(a.starts_at)}</span>
                <span>{svc?.name} · {APPT_STATUS[a.status] ?? a.status}</span>
              </p>
            );
          })}
        </div>
      )}
    </>
  );
}
