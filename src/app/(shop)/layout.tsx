import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getTenant } from "@/lib/tenant";
import { CartProvider } from "@/lib/cart";
import { whatsappLink } from "@/lib/format";
import { readAppearance, themeCss } from "@/lib/theme";
import CartBadge from "@/components/CartBadge";

export async function generateMetadata() {
  const t = await getTenant();
  if (!t) return { title: "Boutique introuvable" };
  return {
    title: t.tenant_settings.seo_title || t.name,
    description: t.tenant_settings.seo_description || undefined,
  };
}

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const tenant = await getTenant();
  if (!tenant) notFound();
  const s = tenant.tenant_settings;
  const a = readAppearance(s);
  const fonts = [s.font_heading, s.font_body].filter(Boolean)
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join("&");

  const headerBar = a.header_style === "primary" ? "bg-primary text-secondary" : "bg-page text-fg";
  const centered = a.header_style === "center";

  const logo = (
    <Link href="/" className="flex items-center gap-2">
      {s.logo_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={s.logo_url} alt={tenant.name} className="h-9 w-auto" />
        : <span className="font-heading text-xl font-bold">{tenant.name}</span>}
    </Link>
  );
  const shop = s.shop_enabled !== false;
  const booking = s.booking_enabled === true;
  const nav = (
    <nav className="flex items-center gap-4 text-sm font-medium">
      {booking && <Link href="/services" className="hover:opacity-70">Services</Link>}
      {shop && <Link href="/produits" className="hover:opacity-70">Produits</Link>}
      {shop && <CartBadge />}
      {booking && <Link href="/reserver" className="rounded-btn bg-accent px-4 py-2 text-white">Réserver</Link>}
    </nav>
  );

  return (
    <CartProvider slug={tenant.slug}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${fonts}&display=swap`} />
      <style dangerouslySetInnerHTML={{ __html: themeCss(s) }} />
      {s.announcement && (
        <div className={`bg-primary px-4 py-2 text-center text-xs font-medium text-secondary sm:text-sm ${a.fx_marquee ? "fx-marquee" : ""}`}>
          {a.fx_marquee ? <span>{s.announcement}</span> : s.announcement}
        </div>
      )}
      <header
        className={`sticky top-0 z-30 border-b border-line ${headerBar}`}
        style={a.fx_glass && a.header_style !== "primary"
          ? { background: "color-mix(in srgb, var(--bg) 72%, transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }
          : undefined}
      >
        {centered ? (
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex justify-center">{logo}</div>
            <div className="mt-2 flex justify-center">{nav}</div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">{logo}{nav}</div>
        )}
      </header>
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-6">{children}</main>
      <footer className={`mt-10 border-t border-line ${a.footer_style === "primary" ? "bg-primary text-secondary" : "bg-surface text-muted"}`}>
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-8 text-sm">
          <p className={`font-heading text-base font-semibold ${a.footer_style === "primary" ? "" : "text-fg"}`}>{tenant.name}</p>
          {s.address && <p>{s.address}</p>}
          {s.phone && <p>Tél : {s.phone}</p>}
          {s.email && <p>{s.email}</p>}
          <div className="flex gap-4 pt-2">
            {s.facebook_url && <a href={s.facebook_url} target="_blank" rel="noreferrer" className="underline">Facebook</a>}
            {s.instagram_url && <a href={s.instagram_url} target="_blank" rel="noreferrer" className="underline">Instagram</a>}
            {s.tiktok_url && <a href={s.tiktok_url} target="_blank" rel="noreferrer" className="underline">TikTok</a>}
          </div>
        </div>
      </footer>
      {s.whatsapp && (
        <a
          href={whatsappLink(s.whatsapp, `Bonjour ${tenant.name}, j'ai une question.`)}
          target="_blank" rel="noreferrer" aria-label="WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </CartProvider>
  );
}
