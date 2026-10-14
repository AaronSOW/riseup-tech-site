import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import { readAppearance, GRID_CLASS } from "@/lib/theme";

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; categorie?: string }> }) {
  const { q, categorie } = await searchParams;
  const tenant = await getTenant();
  if (!tenant || tenant.tenant_settings.shop_enabled === false) notFound();
  const supabase = await createClient();
  const a = readAppearance(tenant.tenant_settings);

  let query = supabase.from("products").select("*").eq("tenant_id", tenant.id).eq("is_active", true).order("position").order("created_at", { ascending: false });
  if (q) query = query.ilike("name", `%${q.replace(/[%,]/g, "")}%`);
  if (categorie) query = query.eq("category_id", categorie);
  const [{ data: products }, { data: categories }] = await Promise.all([
    query,
    supabase.from("product_categories").select("*").eq("tenant_id", tenant.id).order("position"),
  ]);

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm ${active ? "border-primary bg-primary text-secondary" : "border-line"}`;

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">Produits</h1>
      <form className="flex gap-2" action="/produits">
        <input name="q" defaultValue={q} placeholder="Rechercher un produit…" className="field" />
        {categorie && <input type="hidden" name="categorie" value={categorie} />}
        <button className="btn">Chercher</button>
      </form>
      {categories && categories.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link href="/produits" className={chip(!categorie)}>Tous</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/produits?categorie=${c.id}`} className={chip(categorie === c.id)}>{c.name}</Link>
          ))}
        </div>
      )}
      {products && products.length > 0 ? (
        <div className={GRID_CLASS[a.grid_cols]}>
          {products.map((p) => <ProductCard key={p.id} p={p} variant={a.card_style} lift={a.fx_lift3d} />)}
        </div>
      ) : (
        <p className="py-10 text-center text-muted">Aucun produit trouvé.</p>
      )}
    </div>
  );
}
