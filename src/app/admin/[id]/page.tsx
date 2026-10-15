import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUSINESS_TYPES } from "@/lib/presets";
import { updateTenant, addDomain, removeDomain, setMerchantPassword } from "../actions";

export default async function TenantAdmin({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string; created?: string }> }) {
  const { id } = await params;
  const { error, saved, created } = await searchParams;
  const { supabase } = await requireAdminPage();

  const { data: t } = await supabase.from("tenants").select("*, tenant_settings(*)").eq("id", id).maybeSingle();
  if (!t) notFound();
  const s = t.tenant_settings;

  const [{ count: products }, { data: domains }, { data: members }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", id),
    supabase.from("tenant_domains").select("*").eq("tenant_id", id),
    supabase.from("tenant_memberships").select("user_id, role").eq("tenant_id", id),
  ]);

  const admin = createAdminClient();
  const users = await Promise.all((members ?? []).map(async (m) => {
    const { data } = await admin.auth.admin.getUserById(m.user_id);
    return { id: m.user_id, email: data?.user?.email ?? "?" };
  }));

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const siteUrl = root ? `https://${t.slug}.${root}` : null;

  const checks: [string, boolean][] = [
    ["Logo ajouté", !!s.logo_url],
    ["Au moins un produit", (products ?? 0) > 0],
    ["WhatsApp renseigné", !!s.whatsapp],
    ["Paiement configuré (Wave / Orange Money / livraison)",
      (s.wave_enabled && !!s.wave_payment_link) || (s.orange_money_enabled && !!s.orange_money_payment_link) || s.cash_on_delivery_enabled],
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">{t.name}</h1>
      {created && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Boutique créée ✓ Donnez au commerçant son e-mail et son mot de passe provisoire.</p>}
      {saved && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Enregistré ✓</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="dcard space-y-2">
        <h2 className="font-semibold">État de la configuration</h2>
        {checks.map(([label, ok]) => <p key={label} className="text-sm">{ok ? "✅" : "⬜"} {label}</p>)}
        {siteUrl
          ? <a href={siteUrl} target="_blank" className="dbtn-light mt-2">Ouvrir le site ↗</a>
          : <p className="text-xs text-neutral-500">Définissez NEXT_PUBLIC_ROOT_DOMAIN pour afficher le lien du site.</p>}
      </section>

      <form action={updateTenant} className="dcard space-y-4">
        <input type="hidden" name="id" value={id} />
        <h2 className="font-semibold">Informations</h2>
        <div><label className="label">Nom</label><input name="name" defaultValue={t.name} required className="field" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Statut</label>
            <select name="status" defaultValue={t.status} className="field">
              <option value="draft">Brouillon (invisible)</option>
              <option value="published">Publiée</option>
              <option value="suspended">Suspendue</option>
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select name="business_type" defaultValue={t.business_type} className="field">
              {Object.entries(BUSINESS_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Prix vendu (FCFA)</label><input name="sold_price_fcfa" type="number" defaultValue={t.sold_price_fcfa ?? ""} className="field" /></div>
          <div><label className="label">Renouvellement</label><input name="renewal_date" type="date" defaultValue={t.renewal_date ?? ""} className="field" /></div>
        </div>
        <div className="rounded-lg border p-3">
          <p className="label">Modules réservés (que vous seul pouvez activer)</p>
          <label className="flex items-start gap-3 text-sm">
            <input type="hidden" name="module_pos" value="false" />
            <input type="checkbox" name="module_pos" value="true" defaultChecked={t.module_pos === true} className="mt-1" />
            <span><strong className="block">Caisse en magasin + reçus</strong><span className="text-xs text-neutral-500">Ventes sur place, stock mis à jour, reçus imprimables. Invisible pour le commerçant tant que ce n'est pas coché.</span></span>
          </label>
        </div>
        <div><label className="label">Notes internes (privées)</label><textarea name="internal_notes" rows={3} defaultValue={t.internal_notes ?? ""} className="field" /></div>
        <button className="dbtn w-full">Enregistrer</button>
      </form>

      <section className="dcard space-y-3">
        <h2 className="font-semibold">Domaines</h2>
        <p className="text-xs text-neutral-500">Après l'ajout ici, ajoutez aussi le même domaine dans Vercel (Settings &gt; Domains) et configurez le DNS.</p>
        {(domains ?? []).map((d) => (
          <form key={d.id} action={removeDomain} className="flex items-center justify-between text-sm">
            <span>{d.domain}</span>
            <input type="hidden" name="id" value={id} /><input type="hidden" name="domain_id" value={d.id} />
            <button className="dbtn-danger !py-1.5">Retirer</button>
          </form>
        ))}
        <form action={addDomain} className="flex gap-2">
          <input type="hidden" name="id" value={id} />
          <input name="domain" placeholder="www.maboutique.com" required className="field" />
          <button className="dbtn">Ajouter</button>
        </form>
      </section>

      <section className="dcard space-y-3">
        <h2 className="font-semibold">Comptes du commerçant</h2>
        {users.map((u) => (
          <form key={u.id} action={setMerchantPassword} className="space-y-2 border-b pb-3 last:border-0">
            <p className="text-sm font-medium">{u.email}</p>
            <input type="hidden" name="id" value={id} /><input type="hidden" name="user_id" value={u.id} />
            <div className="flex gap-2">
              <input name="password" placeholder="Nouveau mot de passe" minLength={8} required className="field" />
              <button className="dbtn-light">Changer</button>
            </div>
          </form>
        ))}
      </section>
    </>
  );
}
