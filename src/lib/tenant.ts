import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "./supabase/server";

export type Settings = {
  logo_url: string | null; banner_url: string | null;
  primary_color: string; secondary_color: string; accent_color: string;
  font_heading: string; font_body: string;
  hero_title: string | null; hero_subtitle: string | null; about_text: string | null; announcement: string | null;
  whatsapp: string | null; phone: string | null; email: string | null; address: string | null; map_url: string | null;
  facebook_url: string | null; instagram_url: string | null; tiktok_url: string | null;
  sections: string[];
  wave_enabled: boolean; wave_payment_link: string | null;
  orange_money_enabled: boolean; orange_money_payment_link: string | null;
  cash_on_delivery_enabled: boolean; whatsapp_order_enabled: boolean; payment_instructions: string | null;
  seo_title: string | null; seo_description: string | null;
  // apparence avancée (optionnelle : anciennes boutiques sans ces champs = valeurs par défaut)
  theme_mode?: string; bg_color?: string; text_color?: string; ui_radius?: string;
  header_style?: string; hero_style?: string; hero_overlay?: number;
  hero_cta_label?: string | null; hero_cta_link?: string | null;
  card_style?: string; grid_cols?: number; footer_style?: string;
  testimonials?: string | null; gallery_images?: string[];
  hero_video_url?: string | null;
  fx_reveal?: boolean; fx_lift3d?: boolean; fx_glass?: boolean; fx_gradient?: boolean; fx_marquee?: boolean;
  // modules (boutique en ligne / réservations)
  shop_enabled?: boolean; booking_enabled?: boolean; booking_capacity?: number;
  booking_slot_minutes?: number; booking_min_notice_hours?: number; booking_max_days?: number;
  booking_auto_confirm?: boolean; booking_instructions?: string | null;
};

export type Tenant = {
  id: string; slug: string; name: string; business_type: string; status: string;
  tenant_settings: Settings;
};

// Détermine la boutique à partir du nom de domaine de la requête.
export const getTenant = cache(async (): Promise<Tenant | null> => {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0].toLowerCase();
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();
  const supabase = await createClient();

  let slug: string | null = null;
  if (host.endsWith(".localhost")) slug = host.replace(".localhost", "");
  else if (root && host.endsWith("." + root)) slug = host.slice(0, -(root.length + 1));
  else if (host === "localhost" || host.endsWith(".vercel.app")) slug = process.env.DEV_TENANT_SLUG ?? null;

  const select = "*, tenant_settings(*)";
  if (slug) {
    const { data } = await supabase.from("tenants").select(select).eq("slug", slug).maybeSingle();
    return (data as Tenant) ?? null;
  }
  // domaine personnalisé
  const { data: d } = await supabase
    .from("tenant_domains").select("tenant_id").eq("domain", host).maybeSingle();
  if (!d) return null;
  const { data } = await supabase.from("tenants").select(select).eq("id", d.tenant_id).maybeSingle();
  return (data as Tenant) ?? null;
});
