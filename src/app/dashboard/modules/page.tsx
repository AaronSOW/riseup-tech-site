import { getAccess } from "@/lib/auth";
import { saveModules } from "../salon/actions";

export default async function Modules({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { ok, err } = await searchParams;
  const { tenant } = await getAccess();
  const s = tenant!.tenant_settings;
  return (
    <>
      <h1 className="text-2xl font-bold">Modules</h1>
      <p className="text-sm text-neutral-600">Activez uniquement ce dont vous avez besoin. Les menus et les pages du site s'adaptent.</p>
      {ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Enregistré ✓</p>}
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <form action={saveModules} className="dcard space-y-4">
        <label className="flex items-start gap-3">
          <input type="hidden" name="shop_enabled" value="false" />
          <input type="checkbox" name="shop_enabled" value="true" defaultChecked={s.shop_enabled !== false} className="mt-1" />
          <span><strong className="block text-sm">Boutique en ligne</strong><span className="text-xs text-neutral-500">Produits, panier, commandes et stock.</span></span>
        </label>
        <label className="flex items-start gap-3">
          <input type="hidden" name="booking_enabled" value="false" />
          <input type="checkbox" name="booking_enabled" value="true" defaultChecked={s.booking_enabled === true} className="mt-1" />
          <span><strong className="block text-sm">Réservations (salon, massage, soins…)</strong><span className="text-xs text-neutral-500">Services, horaires et agenda des rendez-vous.</span></span>
        </label>
        <label className="flex items-start gap-3">
          <input type="hidden" name="promo_enabled" value="false" />
          <input type="checkbox" name="promo_enabled" value="true" defaultChecked={s.promo_enabled === true} className="mt-1" />
          <span><strong className="block text-sm">Codes promo</strong><span className="text-xs text-neutral-500">Réductions que vos clients saisissent à la commande.</span></span>
        </label>
        <div className="rounded-lg bg-neutral-50 p-3 text-sm">
          <strong>Caisse en magasin : {tenant!.module_pos ? "activée ✓" : "non activée"}</strong>
          <p className="text-xs text-neutral-500">{tenant!.module_pos ? "Vous la trouvez dans le menu (Caisse, Ventes)." : "Ce module est activé par l'administrateur sur demande."}</p>
        </div>
        <button className="dbtn w-full">Enregistrer</button>
      </form>
    </>
  );
}
