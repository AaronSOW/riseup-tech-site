import Link from "next/link";
import { getAccess } from "@/lib/auth";
import { formatFcfa } from "@/lib/format";
import { savePromo, togglePromo, deletePromo } from "../gestion/actions";

export default async function Promos({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { ok, err } = await searchParams;
  const { tenant, supabase } = await getAccess();
  if (tenant!.tenant_settings.promo_enabled !== true)
    return <p className="dcard text-sm">Les codes promo ne sont pas activés. Activez-les dans <Link href="/dashboard/modules" className="underline">Modules</Link>.</p>;

  const { data: promos } = await supabase.from("promo_codes").select("*")
    .eq("tenant_id", tenant!.id).order("created_at", { ascending: false });

  return (
    <>
      <h1 className="text-2xl font-bold">Codes promo</h1>
      {ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Enregistré ✓</p>}
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      <form action={savePromo} className="dcard space-y-3">
        <h2 className="font-semibold">Nouveau code</h2>
        <div><label className="label">Code (que le client tape) *</label><input name="code" required minLength={3} placeholder="BIENVENUE10" className="field uppercase" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type de réduction</label>
            <select name="kind" className="field"><option value="percent">Pourcentage (%)</option><option value="fixed">Montant fixe (FCFA)</option></select>
          </div>
          <div><label className="label">Valeur *</label><input name="value" type="number" min={1} required placeholder="10" className="field" /></div>
          <div><label className="label">Commande minimum (FCFA)</label><input name="min_order_fcfa" type="number" min={0} defaultValue={0} className="field" /></div>
          <div><label className="label">Nombre d'utilisations max</label><input name="max_uses" type="number" min={1} placeholder="illimité" className="field" /></div>
        </div>
        <div><label className="label">Valable jusqu'au (facultatif)</label><input name="expires" type="date" className="field" /></div>
        <button className="dbtn w-full">Créer le code</button>
      </form>

      <div className="space-y-2">
        {(promos ?? []).length === 0 && <p className="text-sm text-neutral-500">Aucun code pour l'instant.</p>}
        {(promos ?? []).map((p) => (
          <div key={p.id} className="dcard flex items-center justify-between gap-3">
            <div>
              <p className="font-mono font-bold">{p.code} {!p.is_active && <span className="text-xs font-normal text-neutral-500">(désactivé)</span>}</p>
              <p className="text-xs text-neutral-600">
                {p.kind === "percent" ? `${p.value} %` : formatFcfa(p.value)}
                {p.min_order_fcfa > 0 ? ` · dès ${formatFcfa(p.min_order_fcfa)}` : ""}
                {` · utilisé ${p.uses}${p.max_uses ? ` / ${p.max_uses}` : ""} fois`}
                {p.expires_at ? ` · jusqu'au ${new Date(p.expires_at).toLocaleDateString("fr-FR")}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <form action={togglePromo}>
                <input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={p.is_active ? "false" : "true"} />
                <button className="dbtn-light !px-3 !py-1.5">{p.is_active ? "Désactiver" : "Activer"}</button>
              </form>
              <form action={deletePromo}>
                <input type="hidden" name="id" value={p.id} />
                <button className="dbtn-danger !px-3 !py-1.5">Supprimer</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
