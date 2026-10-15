import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAccess } from "@/lib/auth";
import { logout } from "./actions";

const shopLinks = [
  ["/dashboard/produits", "Produits"],
  ["/dashboard/stock", "Stock"],
  ["/dashboard/categories", "Catégories"],
  ["/dashboard/commandes", "Commandes"],
];
const bookingLinks = [
  ["/dashboard/rendez-vous", "Rendez-vous"],
  ["/dashboard/services", "Services"],
  ["/dashboard/horaires", "Horaires"],
];

const posLinks = [
  ["/dashboard/caisse", "Caisse"],
  ["/dashboard/ventes", "Ventes"],
];

export const metadata = { title: "Espace commerçant" };

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { tenant, user, allowed } = await getAccess();
  if (!tenant) notFound();
  if (!user) redirect("/login");
  if (!allowed)
    return <div className="p-8 text-center">Accès refusé : ce compte n'est pas rattaché à cette boutique.</div>;

  const st = tenant.tenant_settings;
  const links = [
    ["/dashboard", "Accueil"],
    ...(st.booking_enabled === true ? bookingLinks : []),
    ...(st.shop_enabled !== false ? shopLinks : []),
    ...(tenant.module_pos ? posLinks : []),
    ["/dashboard/clients", "Clients"],
    ...(st.promo_enabled === true ? [["/dashboard/promos", "Codes promo"]] : []),
    ["/dashboard/apparence", "Apparence"],
    ["/dashboard/parametres", "Infos & paiement"],
    ["/dashboard/modules", "Modules"],
  ];

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white">
      <header className="sticky top-0 z-20 border-b bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <p className="font-bold">{tenant.name} <span className="text-xs font-normal text-neutral-500">· dashboard</span></p>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="dbtn-light !py-1.5">Voir le site</Link>
            <form action={logout}><button className="dbtn-light !py-1.5">Quitter</button></form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-neutral-100">{label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
