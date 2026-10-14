import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MapPin } from "lucide-react";
import { getTenant } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink, formatFcfa } from "@/lib/format";
import { readAppearance, GRID_CLASS } from "@/lib/theme";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export default async function Home() {
  const tenant = await getTenant();
  if (!tenant) notFound();
  const s = tenant.tenant_settings;
  const a = readAppearance(s);
  const supabase = await createClient();

  const [{ data: featured }, { data: latest }, { data: categories }, { data: services }] = await Promise.all([
    supabase.from("products").select("*").eq("tenant_id", tenant.id).eq("is_active", true)
      .eq("is_featured", true).order("position").limit(8),
    supabase.from("products").select("*").eq("tenant_id", tenant.id).eq("is_active", true)
      .order("created_at", { ascending: false }).limit(8),
    supabase.from("product_categories").select("*").eq("tenant_id", tenant.id).order("position"),
    supabase.from("services").select("id,name,description,price_fcfa,duration_minutes,image_url")
      .eq("tenant_id", tenant.id).eq("is_active", true).order("position").order("name").limit(6),
  ]);

  const shopOn = s.shop_enabled !== false;
  const bookingOn = s.booking_enabled === true;
  const ctaLabel = a.hero_cta_label || (bookingOn && !shopOn ? "Prendre rendez-vous" : "Voir les produits");
  const ctaLink = a.hero_cta_link || (bookingOn && !shopOn ? "/reserver" : "/produits");
  const cta = (
    <Link href={ctaLink} className="mt-6 inline-block rounded-btn bg-accent px-6 py-3 text-sm font-semibold text-white">
      {ctaLabel}
    </Link>
  );
  const title = s.hero_title || tenant.name;

  const hero = (() => {
    if (a.hero_style === "minimal")
      return (
        <section key="hero" className="py-8 sm:py-14">
          <h1 className="font-heading text-4xl font-bold sm:text-6xl">{title}</h1>
          {s.hero_subtitle && <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">{s.hero_subtitle}</p>}
          {cta}
        </section>
      );
    if (a.hero_style === "split" && s.banner_url)
      return (
        <section key="hero" className="grid overflow-hidden rounded-card bg-surface md:grid-cols-2">
          <div className="flex flex-col items-start justify-center px-6 py-10 sm:px-10">
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">{title}</h1>
            {s.hero_subtitle && <p className="mt-3 text-muted">{s.hero_subtitle}</p>}
            {cta}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.banner_url} alt="" className="h-64 w-full object-cover md:h-full" />
        </section>
      );
    const withVideo = a.hero_style === "image" && !!a.hero_video_url;
    const withImage = a.hero_style === "image" && !!s.banner_url && !withVideo;
    const o = Math.min(80, Math.max(0, a.hero_overlay)) / 100;
    const gradient = a.fx_gradient && !withImage && !withVideo;
    return (
      <section
        key="hero"
        className={`relative overflow-hidden rounded-card bg-primary text-secondary ${gradient ? "fx-gradient" : ""}`}
        style={withImage ? { backgroundImage: `linear-gradient(rgba(0,0,0,${o}),rgba(0,0,0,${o})),url(${s.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {withVideo && (
          <>
            <video
              className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
              src={a.hero_video_url ?? undefined} poster={s.banner_url ?? undefined}
              autoPlay muted loop playsInline preload="metadata"
            />
            <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${o})` }} />
          </>
        )}
        <div className="relative px-6 py-16 text-center sm:py-24">
          <h1 className="font-heading text-3xl font-bold sm:text-5xl">{title}</h1>
          {s.hero_subtitle && <p className="mx-auto mt-3 max-w-xl text-base opacity-90 sm:text-lg">{s.hero_subtitle}</p>}
          {cta}
        </div>
      </section>
    );
  })();

  const reviews = (a.testimonials ?? "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf("|");
    return i > 0 ? { who: l.slice(0, i).trim(), text: l.slice(i + 1).trim() } : { who: "", text: l };
  });

  const sections: Record<string, React.ReactNode> = {
    hero,
    services: bookingOn && services && services.length > 0 && (
      <section key="services">
        <h2 className="font-heading mb-4 text-xl font-bold sm:text-2xl">Nos services</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((sv) => (
            <Link key={sv.id} href={`/reserver?service=${sv.id}`} className={`flex flex-col rounded-card border border-line bg-surface p-4 hover:opacity-90 ${a.fx_lift3d ? "fx-lift" : ""}`}>
              <p className="font-semibold">{sv.name}</p>
              {sv.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{sv.description}</p>}
              <p className="mt-auto pt-3 text-sm"><span className="font-semibold">{formatFcfa(sv.price_fcfa)}</span> <span className="text-muted">· {sv.duration_minutes} min</span></p>
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center"><Link href="/services" className="btn-outline">Voir tous les services</Link></div>
      </section>
    ),
    featured: shopOn && featured && featured.length > 0 && (
      <section key="featured">
        <h2 className="font-heading mb-4 text-xl font-bold sm:text-2xl">Nos coups de cœur</h2>
        <div className={GRID_CLASS[a.grid_cols]}>
          {featured.map((p) => <ProductCard key={p.id} p={p} variant={a.card_style} lift={a.fx_lift3d} />)}
        </div>
      </section>
    ),
    new_arrivals: shopOn && latest && latest.length > 0 && (
      <section key="new_arrivals">
        <h2 className="font-heading mb-4 text-xl font-bold sm:text-2xl">Nouveautés</h2>
        <div className={GRID_CLASS[a.grid_cols]}>
          {latest.map((p) => <ProductCard key={p.id} p={p} variant={a.card_style} lift={a.fx_lift3d} />)}
        </div>
      </section>
    ),
    categories: shopOn && categories && categories.length > 0 && (
      <section key="categories">
        <h2 className="font-heading mb-4 text-xl font-bold sm:text-2xl">Catégories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.id} href={`/produits?categorie=${c.id}`} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-primary hover:text-secondary">
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    ),
    about: s.about_text && (
      <section key="about" className="rounded-card bg-surface p-6">
        <h2 className="font-heading mb-2 text-xl font-bold">À propos</h2>
        <p className="whitespace-pre-line text-muted">{s.about_text}</p>
      </section>
    ),
    gallery: a.gallery_images.length > 0 && (
      <section key="gallery">
        <h2 className="font-heading mb-4 text-xl font-bold sm:text-2xl">Galerie</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {a.gallery_images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="aspect-square w-full rounded-card object-cover" />
          ))}
        </div>
      </section>
    ),
    testimonials: reviews.length > 0 && (
      <section key="testimonials">
        <h2 className="font-heading mb-4 text-xl font-bold sm:text-2xl">Ils nous font confiance</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <figure key={i} className="rounded-card border border-line bg-surface p-4">
              <blockquote className="text-sm">« {r.text} »</blockquote>
              {r.who && <figcaption className="mt-2 text-xs font-semibold text-muted">{r.who}</figcaption>}
            </figure>
          ))}
        </div>
      </section>
    ),
    contact: (s.whatsapp || s.phone || s.address) && (
      <section key="contact" className="space-y-3">
        <h2 className="font-heading text-xl font-bold sm:text-2xl">Nous contacter</h2>
        {s.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{s.phone}</p>}
        {s.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{s.address}</p>}
        <div className="flex flex-wrap gap-3 pt-1">
          {s.whatsapp && (
            <a className="btn" href={whatsappLink(s.whatsapp, `Bonjour ${tenant.name}`)} target="_blank" rel="noreferrer">Écrire sur WhatsApp</a>
          )}
          {s.map_url && <a className="btn-outline" href={s.map_url} target="_blank" rel="noreferrer">Voir sur la carte</a>}
        </div>
      </section>
    ),
  };

  return (
    <div className="space-y-10">
      {(s.sections ?? []).map((k) => {
        const node = sections[k];
        if (!node) return null;
        return a.fx_reveal && k !== "hero" ? <Reveal key={k}>{node}</Reveal> : node;
      })}
    </div>
  );
}
