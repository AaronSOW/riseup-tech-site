import Link from "next/link";
import { getAccess } from "@/lib/auth";
import PosTerminal from "@/components/PosTerminal";

export default async function Caisse() {
  const { tenant, supabase } = await getAccess();
  if (!tenant!.module_pos)
    return <p className="dcard text-sm">La caisse n'est pas activée pour votre boutique. Contactez l'administrateur pour l'activer.</p>;

  const [{ data: products }, { data: services }] = await Promise.all([
    supabase.from("products").select("id,name,price_fcfa,stock_quantity").eq("tenant_id", tenant!.id).eq("is_active", true).order("name").limit(500),
    tenant!.tenant_settings.booking_enabled === true
      ? supabase.from("services").select("id,name,price_fcfa").eq("tenant_id", tenant!.id).eq("is_active", true).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string; price_fcfa: number }[] }),
  ]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Caisse</h1>
        <Link href="/dashboard/ventes" className="dbtn-light">Voir les ventes</Link>
      </div>
      <PosTerminal products={products ?? []} services={services ?? []} promoEnabled={tenant!.tenant_settings.promo_enabled === true} />
    </>
  );
}
