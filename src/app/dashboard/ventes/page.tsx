import Link from "next/link";
import { getAccess } from "@/lib/auth";
import { formatFcfa } from "@/lib/format";
import { PAYMENT_LABEL, formatDateTime } from "@/lib/pos";
import { saveReceiptSettings } from "../gestion/actions";

export default async function Sales({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const { tenant, supabase } = await getAccess();
  if (!tenant!.module_pos)
    return <p className="dcard text-sm">La caisse n'est pas activée pour votre boutique. Contactez l'administrateur pour l'activer.</p>;

  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0); // Dakar = UTC
  const [{ data: sales }, { data: today }] = await Promise.all([
    supabase.from("sales").select("id,receipt_number,customer_name,total_fcfa,payment_method,status,created_at")
      .eq("tenant_id", tenant!.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("sales").select("total_fcfa,payment_method")
      .eq("tenant_id", tenant!.id).eq("status", "completed").gte("created_at", dayStart.toISOString()),
  ]);

  const byMethod: Record<string, number> = {};
  let dayTotal = 0;
  for (const s of today ?? []) { dayTotal += s.total_fcfa; byMethod[s.payment_method] = (byMethod[s.payment_method] ?? 0) + s.total_fcfa; }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ventes en magasin</h1>
        <Link href="/dashboard/caisse" className="dbtn">Ouvrir la caisse</Link>
      </div>
      {ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Enregistré ✓</p>}

      <div className="dcard space-y-2">
        <h2 className="font-semibold">Aujourd'hui</h2>
        <p className="text-2xl font-bold">{formatFcfa(dayTotal)} <span className="text-sm font-normal text-neutral-500">· {(today ?? []).length} vente(s)</span></p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
          {Object.entries(byMethod).map(([k, v]) => <span key={k}>{PAYMENT_LABEL[k] ?? k} : <strong>{formatFcfa(v)}</strong></span>)}
        </div>
      </div>

      <div className="dcard divide-y p-0 sm:p-0">
        {(sales ?? []).length === 0 && <p className="p-4 text-sm text-neutral-500">Aucune vente pour l'instant.</p>}
        {(sales ?? []).map((s) => (
          <Link key={s.id} href={`/dashboard/ventes/${s.id}`} className="flex items-center gap-3 p-3 hover:bg-neutral-50">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Reçu n°{s.receipt_number}{s.customer_name ? ` · ${s.customer_name}` : ""}</p>
              <p className="text-xs text-neutral-500">{formatDateTime(s.created_at)} · {PAYMENT_LABEL[s.payment_method] ?? s.payment_method}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatFcfa(s.total_fcfa)}</p>
              {s.status === "refunded" && <p className="text-xs text-red-600">Remboursé</p>}
            </div>
          </Link>
        ))}
      </div>

      <form action={saveReceiptSettings} className="dcard space-y-3">
        <h2 className="font-semibold">Message en bas des reçus</h2>
        <textarea name="receipt_footer" rows={2} defaultValue={tenant!.tenant_settings.receipt_footer ?? ""} placeholder="Merci de votre visite ! Échanges possibles sous 7 jours avec ce reçu." className="field" />
        <button className="dbtn w-full">Enregistrer</button>
      </form>
    </>
  );
}
