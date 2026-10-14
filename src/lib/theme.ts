// Tout ce qui concerne l'apparence des boutiques : thèmes de fond, arrondis, modèles prêts à l'emploi.

export const THEMES: Record<string, { label: string; bg: string; fg: string }> = {
  white: { label: "Blanc", bg: "#ffffff", fg: "#171717" },
  cream: { label: "Crème", bg: "#faf6ef", fg: "#2b2118" },
  light_gray: { label: "Gris clair", bg: "#f0f0f0", fg: "#171717" },
  dark_gray: { label: "Gris foncé", bg: "#2a2a2d", fg: "#f4f4f5" },
  black: { label: "Noir", bg: "#0b0b0c", fg: "#f5f5f5" },
  custom: { label: "Personnalisé", bg: "#ffffff", fg: "#171717" },
};

export const RADII: Record<string, { label: string; btn: string; card: string }> = {
  none: { label: "Angles droits", btn: "0px", card: "0px" },
  sm: { label: "Légers", btn: "4px", card: "6px" },
  md: { label: "Moyens", btn: "8px", card: "12px" },
  lg: { label: "Arrondis", btn: "12px", card: "20px" },
  full: { label: "Très arrondis", btn: "9999px", card: "24px" },
};

export const HEADER_STYLES: Record<string, string> = {
  left: "Logo à gauche",
  center: "Logo centré",
  primary: "Barre de couleur",
};
export const HERO_STYLES: Record<string, string> = {
  image: "Grande image avec texte",
  simple: "Bloc de couleur",
  split: "Texte à gauche, image à droite",
  minimal: "Texte seul, épuré",
};
export const CARD_STYLES: Record<string, string> = {
  plain: "Simple",
  bordered: "Avec bordure",
  shadow: "Avec ombre",
};
export const FOOTER_STYLES: Record<string, string> = {
  surface: "Discret",
  primary: "Couleur principale",
};

export const EFFECTS: Record<string, { label: string; hint: string }> = {
  fx_reveal: { label: "Apparition en douceur", hint: "Les sections glissent et apparaissent quand on défile la page." },
  fx_lift3d: { label: "Cartes en relief 3D", hint: "Les produits et services se soulèvent et s'inclinent au survol." },
  fx_glass: { label: "En-tête en verre dépoli", hint: "Le menu est translucide et floute ce qui passe derrière." },
  fx_gradient: { label: "Dégradé animé", hint: "Le bloc de couleur de la bannière change doucement de teinte." },
  fx_marquee: { label: "Bandeau d'annonce défilant", hint: "Le texte d'annonce défile comme une enseigne." },
};

export const FONTS = [
  "Inter", "Poppins", "Montserrat", "Playfair Display", "Lora", "Raleway", "Nunito",
  "Cormorant Garamond", "Roboto", "Open Sans", "Lato", "DM Sans", "Merriweather",
  "Oswald", "Quicksand", "Josefin Sans", "Bebas Neue", "Great Vibes",
];

// Toutes les sections possibles de la page d'accueil (le salon en ajoute d'autres plus tard).
export const SECTION_LABELS: Record<string, string> = {
  hero: "Bannière d'accueil",
  services: "Nos services (salons)",
  featured: "Produits en avant",
  new_arrivals: "Nouveautés",
  categories: "Catégories",
  about: "À propos",
  gallery: "Galerie photos",
  testimonials: "Avis clients",
  contact: "Contact",
};

export type Appearance = {
  theme_mode: string; bg_color: string; text_color: string; ui_radius: string;
  header_style: string; hero_style: string; hero_overlay: number;
  hero_cta_label: string | null; hero_cta_link: string | null;
  card_style: string; grid_cols: number; footer_style: string;
  testimonials: string | null; gallery_images: string[];
  hero_video_url: string | null;
  fx_reveal: boolean; fx_lift3d: boolean; fx_glass: boolean; fx_gradient: boolean; fx_marquee: boolean;
};

// Lit les réglages en gardant des valeurs par défaut sûres (anciennes boutiques comprises).
export function readAppearance(s: Partial<Appearance> | null | undefined): Appearance {
  const a = s ?? {};
  const pick = (v: string | undefined, list: Record<string, unknown>, d: string) => (v && v in list ? v : d);
  return {
    theme_mode: pick(a.theme_mode, THEMES, "white"),
    bg_color: a.bg_color || "#ffffff",
    text_color: a.text_color || "#171717",
    ui_radius: pick(a.ui_radius, RADII, "md"),
    header_style: pick(a.header_style, HEADER_STYLES, "left"),
    hero_style: pick(a.hero_style, HERO_STYLES, "image"),
    hero_overlay: typeof a.hero_overlay === "number" ? a.hero_overlay : 45,
    hero_cta_label: a.hero_cta_label ?? null,
    hero_cta_link: a.hero_cta_link ?? null,
    card_style: pick(a.card_style, CARD_STYLES, "plain"),
    grid_cols: [2, 3, 4].includes(Number(a.grid_cols)) ? Number(a.grid_cols) : 4,
    footer_style: pick(a.footer_style, FOOTER_STYLES, "surface"),
    testimonials: a.testimonials ?? null,
    gallery_images: Array.isArray(a.gallery_images) ? a.gallery_images : [],
    hero_video_url: a.hero_video_url || null,
    fx_reveal: a.fx_reveal === true, fx_lift3d: a.fx_lift3d === true, fx_glass: a.fx_glass === true,
    fx_gradient: a.fx_gradient === true, fx_marquee: a.fx_marquee === true,
  };
}

export function themeColors(a: Appearance) {
  if (a.theme_mode === "custom") return { bg: a.bg_color, fg: a.text_color };
  const t = THEMES[a.theme_mode] ?? THEMES.white;
  return { bg: t.bg, fg: t.fg };
}

// Classes statiques (Tailwind ne devine pas les classes construites dynamiquement).
export const GRID_CLASS: Record<number, string> = {
  2: "grid grid-cols-2 gap-4",
  3: "grid grid-cols-2 gap-4 sm:grid-cols-3",
  4: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
};

export function themeCss(s: {
  primary_color: string; secondary_color: string; accent_color: string;
  font_heading: string; font_body: string;
} & Partial<Appearance>) {
  const a = readAppearance(s);
  const { bg, fg } = themeColors(a);
  const r = RADII[a.ui_radius];
  return `:root{--primary:${s.primary_color};--secondary:${s.secondary_color};--accent:${s.accent_color};` +
    `--font-heading:"${s.font_heading}";--font-body:"${s.font_body}";` +
    `--bg:${bg};--fg:${fg};` +
    `--surface:color-mix(in srgb,${fg} 6%,${bg});--line:color-mix(in srgb,${fg} 16%,${bg});--muted:color-mix(in srgb,${fg} 62%,${bg});` +
    `--r-btn:${r.btn};--r-card:${r.card}}\n` +
    `body{background:var(--bg);color:var(--fg);font-family:var(--font-body),system-ui,sans-serif}` +
    `h1,h2,h3,.font-heading{font-family:var(--font-heading),system-ui,sans-serif}`;
}

// Modèles prêts à l'emploi : un clic change tout le style (sans toucher aux textes ni aux produits).
export const TEMPLATES: Record<string, { label: string; description: string; patch: Record<string, string | number> }> = {
  classic: {
    label: "Classique", description: "Sobre et polyvalent, fond blanc.",
    patch: { theme_mode: "white", ui_radius: "md", header_style: "left", hero_style: "image", card_style: "plain",
      grid_cols: 4, footer_style: "surface", primary_color: "#111111", secondary_color: "#ffffff", accent_color: "#c9a227",
      font_heading: "Poppins", font_body: "Inter" },
  },
  elegant: {
    label: "Élégant sombre", description: "Fond noir et touches dorées, très chic.",
    patch: { theme_mode: "black", ui_radius: "sm", header_style: "center", hero_style: "minimal", card_style: "bordered",
      grid_cols: 3, footer_style: "surface", primary_color: "#d4af37", secondary_color: "#111111", accent_color: "#d4af37",
      font_heading: "Playfair Display", font_body: "Lato" },
  },
  modern: {
    label: "Moderne", description: "Arrondi, coloré, avec ombres douces.",
    patch: { theme_mode: "light_gray", ui_radius: "full", header_style: "primary", hero_style: "split", card_style: "shadow",
      grid_cols: 4, footer_style: "primary", primary_color: "#2563eb", secondary_color: "#ffffff", accent_color: "#f59e0b",
      font_heading: "Montserrat", font_body: "DM Sans" },
  },
  minimal: {
    label: "Minimal", description: "Épuré, beaucoup d'espace, angles droits.",
    patch: { theme_mode: "white", ui_radius: "none", header_style: "center", hero_style: "minimal", card_style: "plain",
      grid_cols: 3, footer_style: "surface", primary_color: "#171717", secondary_color: "#ffffff", accent_color: "#171717",
      font_heading: "Raleway", font_body: "Inter" },
  },
  beauty: {
    label: "Beauté", description: "Crème et rose poudré, élégant et doux.",
    patch: { theme_mode: "cream", ui_radius: "lg", header_style: "center", hero_style: "image", card_style: "bordered",
      grid_cols: 3, footer_style: "surface", primary_color: "#b76e79", secondary_color: "#ffffff", accent_color: "#d4af37",
      font_heading: "Cormorant Garamond", font_body: "Nunito" },
  },
};
