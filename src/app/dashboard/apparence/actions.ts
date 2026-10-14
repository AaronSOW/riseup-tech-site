"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import {
  EFFECTS, THEMES, RADII, HEADER_STYLES, HERO_STYLES, CARD_STYLES, FOOTER_STYLES, TEMPLATES, SECTION_LABELS,
} from "@/lib/theme";

const COLOR = /^#[0-9a-fA-F]{6}$/;
const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optional = (fd: FormData, k: string) => text(fd, k) || null;
const imageOrNull = (fd: FormData, k: string) => (fd.getAll(k).at(-1) ? String(fd.getAll(k).at(-1)) : null);

export async function updateAppearance(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const patch: Record<string, unknown> = {};

  // couleurs
  for (const k of ["primary_color", "secondary_color", "accent_color", "bg_color", "text_color"])
    if (COLOR.test(text(fd, k))) patch[k] = text(fd, k);

  // choix dans des listes fermées
  const choice = (k: string, list: Record<string, unknown>) => { const v = text(fd, k); if (v in list) patch[k] = v; };
  choice("theme_mode", THEMES); choice("ui_radius", RADII); choice("header_style", HEADER_STYLES);
  choice("hero_style", HERO_STYLES); choice("card_style", CARD_STYLES); choice("footer_style", FOOTER_STYLES);

  const cols = parseInt(text(fd, "grid_cols"), 10);
  if ([2, 3, 4].includes(cols)) patch.grid_cols = cols;
  const overlay = parseInt(text(fd, "hero_overlay"), 10);
  if (Number.isFinite(overlay)) patch.hero_overlay = Math.min(80, Math.max(0, overlay));

  for (const k of ["font_heading", "font_body"]) if (text(fd, k)) patch[k] = text(fd, k);

  // textes
  for (const k of ["hero_title", "hero_subtitle", "hero_cta_label", "hero_cta_link", "about_text",
    "announcement", "seo_title", "seo_description", "testimonials"]) patch[k] = optional(fd, k);

  // images
  patch.logo_url = imageOrNull(fd, "logo_url");
  patch.banner_url = imageOrNull(fd, "banner_url");
  patch.gallery_images = fd.getAll("gallery_images").map(String).filter(Boolean);

  // effets modernes (cases à cocher) + vidéo
  for (const k of Object.keys(EFFECTS)) patch[k] = fd.getAll(k).at(-1) === "true";
  patch.hero_video_url = optional(fd, "hero_video_url");

  // sections : cochées + ordre choisi
  const chosen = fd.getAll("sections").map(String).filter((k) => k in SECTION_LABELS);
  const order = (k: string) => { const n = parseInt(text(fd, `order_${k}`), 10); return Number.isFinite(n) ? n : 99; };
  patch.sections = [...chosen].sort((x, y) => order(x) - order(y));

  const { error } = await supabase.from("tenant_settings").update(patch).eq("tenant_id", tenant.id);
  revalidatePath("/", "layout");
  if (error) redirect(`/dashboard/apparence?err=${encodeURIComponent(error.message)}`);
  redirect("/dashboard/apparence?ok=1");
}

export async function applyTemplate(fd: FormData) {
  const { tenant, supabase } = await requireMember();
  const t = TEMPLATES[text(fd, "template")];
  if (!t) redirect("/dashboard/apparence?err=" + encodeURIComponent("Modèle inconnu."));
  const { error } = await supabase.from("tenant_settings").update(t.patch).eq("tenant_id", tenant.id);
  revalidatePath("/", "layout");
  if (error) redirect(`/dashboard/apparence?err=${encodeURIComponent(error.message)}`);
  redirect("/dashboard/apparence?ok=1");
}
