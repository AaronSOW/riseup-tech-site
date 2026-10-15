import Link from "next/link";
import { getAccess } from "@/lib/auth";
import { formatFcfa } from "@/lib/format";
import { saveCustomer } from "../gestion/actions";

export default async function Customers({
  searchParams,
}: { searchParams: Promise<{ q?: string; ok?: string; err?: string }> }) {
  const { q, ok, err } = await searchParams;
  const { tenant, supabase } = await getAccess();
  const tid = tenant!.id;

  let query = supabase.from("customers").select("id,name,phone,created_at").eq("tenant_id", tid)
    .order("created_at", { ascending: false }).limit(200);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ").trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }
  const { data: customers } = await query;
  const ids = (customers ?? []).map((c) => c.id);

  const [{ data: orders }, { data: sales }, { data: appts }] = ids.length === 0 ? [{ data: [] }, { data: [] }, { data: [] }] : await Promise.all([
    supabase.from("orders").select("customer_id,total_fcfa,status").eq("tenant_id", tid).in("customer_id", ids),
    supabase.from("sales").select("customer_id,total_fcfa,status").eq("tenant_id", tid).in("customer_id", ids),
    supabase.from("appointments").select("customer_id,status").eq("tenant_id", tid).in("customer_id", ids),
  ]);

  const stats = new Map<string, { n: number; spent: number }>();
  const bump = (id: string | null, amount: number) => {
    if (!id) return;
    const s = stats.get(id) ?? { n: 0, spent: 0 };
    s.n += 1; s.spent += amount; stats.set(id, s);
  };
  for (const o of orders ?? []) if (o.status !== "cancelled") bump(o.customer_id, o.total_fcfa);
  for (const s of sales ?? []) if (s.status === "completed") bump(s.customer_id, s.total_fcfa);
  for (const a of appts ?? []) if (a.status !== "cancelled") bump(a.customer_id, 0);

  const rows = (customers ?? []).map((c) => ({ ...c, ...(stats.get(c.id) ?? { n: 0, spent: 0 }) }))
    .sort((a, b) => b.spent - a.spent);

  return (
    <>
      <h1 className="text-2xl font-bold">Clients</h1>
      {ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Enregistré ✓</p>}
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <p className="text-sm text-neutral-600">Les clients s'ajoutent tout seuls quand ils commandent, réservent ou achètent en magasin avec leur numéro de téléphone.</p>

      <form className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Chercher un nom ou un numéro…" className="field" />
        <button className="dbtn-light">Chercher</button>
      </form>

      <details className="dcard">
        <summary className="cursor-pointer text-sm font-semibold">+ Ajouter un client</summary>
        <form action={saveCustomer} className="mt-3 space-y-3">
          <input name="name" required minLength={2} placeholder="Nom *" className="field" />
          <input name="phone" type="tel" placeholder="Téléphone" className="field" />
          <input name="email" type="email" placeholder="E-mail" className="field" />
          <button className="dbtn w-full">Ajouter</button>
        </form>
      </details>

      <div className="dcard divide-y p-0 sm:p-0">
        {rows.length === 0 && <p className="p-4 text-sm text-neutral-500">Aucun client pour l'instant.</p>}
        {rows.map((c) => (
          <Link key={c.id} href={`/dashboard/clients/${c.id}`} className="flex items-center gap-3 p-3 hover:bg-neutral-50">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="text-xs text-neutral-500">{c.phone ?? "Pas de numéro"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{formatFcfa(c.spent)}</p>
              <p className="text-xs text-neutral-500">{c.n} achat(s) / rdv</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
