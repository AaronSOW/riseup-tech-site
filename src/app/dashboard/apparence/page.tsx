import { getAccess } from "@/lib/auth";
import ImageUploader from "@/components/ImageUploader";
import VideoUploader from "@/components/VideoUploader";
import {
  EFFECTS, THEMES, RADII, HEADER_STYLES, HERO_STYLES, CARD_STYLES, FOOTER_STYLES, FONTS, TEMPLATES,
  SECTION_LABELS, readAppearance,
} from "@/lib/theme";
import { updateAppearance, applyTemplate } from "./actions";

export default async function Appearance({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { ok, err } = await searchParams;
  const { tenant } = await getAccess();
  const s = tenant!.tenant_settings;
  const a = readAppearance(s);
  const tid = tenant!.id;

  const fontSelect = (name: string, value: string) => (
    <select name={name} defaultValue={value} className="field">
      {[...new Set([value, ...FONTS])].map((f) => <option key={f}>{f}</option>)}
    </select>
  );
  const radio = (name: string, list: Record<string, string>, current: string) => (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {Object.entries(list).map(([k, label]) => (
        <label key={k} className="flex items-center gap-2 rounded-lg border p-2.5">
          <input type="radio" name={name} value={k} defaultChecked={current === k} /> {label}
        </label>
      ))}
    </div>
  );
  const color = (name: string, label: string, value: string) => (
    <div><label className="label">{label}</label><input type="color" name={name} defaultValue={value} className="h-11 w-full rounded-lg border" /></div>
  );

  // toutes les sections possibles, dans l'ordre actuel puis les autres
  const current = s.sections ?? [];
  const keys = [...current.filter((k) => k in SECTION_LABELS), ...Object.keys(SECTION_LABELS).filter((k) => !current.includes(k))];

  return (
    <>
      <h1 className="text-2xl font-bold">Apparence du site</h1>
      {ok && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Enregistré ✓ Les changements sont visibles sur votre site.</p>}
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      <div className="dcard space-y-3">
        <div>
          <h2 className="font-semibold">Modèles prêts à l'emploi</h2>
          <p className="text-sm text-neutral-600">Un clic change les couleurs, la police et le style. Vos produits et vos textes ne changent pas. Vous pourrez ensuite ajuster chaque détail plus bas.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(TEMPLATES).map(([k, t]) => (
            <form key={k} action={applyTemplate} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <input type="hidden" name="template" value={k} />
              <div><p className="text-sm font-semibold">{t.label}</p><p className="text-xs text-neutral-500">{t.description}</p></div>
              <button className="dbtn-light !px-3 !py-1.5">Appliquer</button>
            </form>
          ))}
        </div>
      </div>

      <form action={updateAppearance} className="space-y-5">
        <div className="dcard space-y-4">
          <h2 className="font-semibold">Identité</h2>
          <div><label className="label">Logo</label><ImageUploader name="logo_url" tenantId={tid} defaultValue={s.logo_url ? [s.logo_url] : []} /></div>
          <div><label className="label">Image de bannière</label><ImageUploader name="banner_url" tenantId={tid} defaultValue={s.banner_url ? [s.banner_url] : []} /></div>
          <div>
            <label className="label">Vidéo de bannière (derrière le texte d'accueil)</label>
            <VideoUploader name="hero_video_url" tenantId={tid} defaultValue={a.hero_video_url} />
            <p className="mt-1 text-xs text-neutral-500">Elle remplace l'image tant qu'elle est présente. Style de bannière à choisir : « Grande image avec texte ». L'image de bannière sert d'aperçu pendant le chargement.</p>
          </div>
        </div>

        <div className="dcard space-y-3">
          <h2 className="font-semibold">Effets modernes</h2>
          <p className="text-xs text-neutral-500">Chaque effet est facultatif. Ils sont légers et se désactivent seuls pour les personnes qui ont réduit les animations sur leur téléphone.</p>
          {Object.entries(EFFECTS).map(([k, e]) => (
            <label key={k} className="flex items-start gap-3 text-sm">
              <input type="hidden" name={k} value="false" />
              <input type="checkbox" name={k} value="true" defaultChecked={a[k as keyof typeof a] === true} className="mt-1" />
              <span><strong className="block">{e.label}</strong><span className="text-xs text-neutral-500">{e.hint}</span></span>
            </label>
          ))}
        </div>

        <div className="dcard space-y-4">
          <h2 className="font-semibold">Couleurs</h2>
          <div>
            <p className="label">Fond du site</p>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {Object.entries(THEMES).map(([k, t]) => (
                <label key={k} className="flex items-center gap-2 rounded-lg border p-2.5">
                  <input type="radio" name="theme_mode" value={k} defaultChecked={a.theme_mode === k} />
                  {k !== "custom" && <span className="inline-block h-5 w-5 rounded border" style={{ background: t.bg }} />}
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {color("bg_color", "Fond (si « Personnalisé »)", a.bg_color)}
            {color("text_color", "Texte (si « Personnalisé »)", a.text_color)}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {color("primary_color", "Couleur principale", s.primary_color)}
            {color("secondary_color", "Texte sur principale", s.secondary_color)}
            {color("accent_color", "Couleur d'accent", s.accent_color)}
          </div>
          <p className="text-xs text-neutral-500">Sur un fond sombre, choisissez une couleur principale claire (doré, blanc…) pour que les boutons restent visibles.</p>
        </div>

        <div className="dcard space-y-4">
          <h2 className="font-semibold">Polices</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Titres</label>{fontSelect("font_heading", s.font_heading)}</div>
            <div><label className="label">Texte</label>{fontSelect("font_body", s.font_body)}</div>
          </div>
        </div>

        <div className="dcard space-y-4">
          <h2 className="font-semibold">Style</h2>
          <div><p className="label">Arrondis des boutons et des cartes</p>{radio("ui_radius", Object.fromEntries(Object.entries(RADII).map(([k, v]) => [k, v.label])), a.ui_radius)}</div>
          <div><p className="label">En-tête</p>{radio("header_style", HEADER_STYLES, a.header_style)}</div>
          <div><p className="label">Cartes produits</p>{radio("card_style", CARD_STYLES, a.card_style)}</div>
          <div>
            <p className="label">Produits par ligne (ordinateur)</p>
            <div className="flex gap-2 text-sm">
              {[2, 3, 4].map((n) => (
                <label key={n} className="flex items-center gap-2 rounded-lg border p-2.5"><input type="radio" name="grid_cols" value={n} defaultChecked={a.grid_cols === n} /> {n}</label>
              ))}
            </div>
          </div>
          <div><p className="label">Pied de page</p>{radio("footer_style", FOOTER_STYLES, a.footer_style)}</div>
        </div>

        <div className="dcard space-y-4">
          <h2 className="font-semibold">Page d'accueil</h2>
          <div><p className="label">Style de la bannière</p>{radio("hero_style", HERO_STYLES, a.hero_style)}</div>
          <div><label className="label">Assombrir l'image de bannière : {a.hero_overlay} %</label><input type="number" name="hero_overlay" min={0} max={80} defaultValue={a.hero_overlay} className="field" /></div>
          <div><label className="label">Bandeau d'annonce</label><input name="announcement" defaultValue={s.announcement ?? ""} placeholder="Livraison gratuite dès 20 000 FCFA" className="field" /></div>
          <div><label className="label">Titre de l'accueil</label><input name="hero_title" defaultValue={s.hero_title ?? ""} className="field" /></div>
          <div><label className="label">Sous-titre</label><input name="hero_subtitle" defaultValue={s.hero_subtitle ?? ""} className="field" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Texte du bouton</label><input name="hero_cta_label" defaultValue={a.hero_cta_label ?? ""} placeholder="Voir les produits" className="field" /></div>
            <div><label className="label">Lien du bouton</label><input name="hero_cta_link" defaultValue={a.hero_cta_link ?? ""} placeholder="/produits" className="field" /></div>
          </div>
        </div>

        <div className="dcard space-y-3">
          <h2 className="font-semibold">Sections de l'accueil</h2>
          <p className="text-sm text-neutral-600">Cochez celles à afficher, et numérotez-les pour choisir l'ordre (1 = en haut).</p>
          <div className="space-y-2">
            {keys.map((k, i) => (
              <div key={k} className="flex items-center gap-3 text-sm">
                <input type="number" name={`order_${k}`} min={1} max={20} defaultValue={i + 1} className="field !w-16" aria-label={`Ordre ${SECTION_LABELS[k]}`} />
                <label className="flex items-center gap-2"><input type="checkbox" name="sections" value={k} defaultChecked={current.includes(k)} /> {SECTION_LABELS[k]}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="dcard space-y-4">
          <h2 className="font-semibold">Contenus</h2>
          <div><label className="label">Texte « À propos »</label><textarea name="about_text" rows={4} defaultValue={s.about_text ?? ""} className="field" /></div>
          <div>
            <label className="label">Avis clients (un avis par ligne, au format : Nom | Avis)</label>
            <textarea name="testimonials" rows={4} defaultValue={a.testimonials ?? ""} placeholder={"Awa | Très belle qualité, livraison rapide !\nMoussa | Je recommande"} className="field" />
          </div>
          <div><label className="label">Galerie photos</label><ImageUploader name="gallery_images" tenantId={tid} defaultValue={a.gallery_images} multiple /></div>
        </div>

        <div className="dcard space-y-4">
          <h2 className="font-semibold">Référencement Google</h2>
          <div><label className="label">Titre</label><input name="seo_title" defaultValue={s.seo_title ?? ""} className="field" /></div>
          <div><label className="label">Description</label><input name="seo_description" defaultValue={s.seo_description ?? ""} className="field" /></div>
        </div>

        <button className="dbtn w-full">Enregistrer</button>
      </form>
    </>
  );
}
