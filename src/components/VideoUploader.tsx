"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Envoie une courte vidéo (mp4 / webm) dans Supabase Storage et renvoie l'URL dans un champ caché.
export default function VideoUploader({
  name, tenantId, defaultValue = null,
}: { name: string; tenantId: string; defaultValue?: string | null }) {
  const [url, setUrl] = useState<string | null>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    if (!["video/mp4", "video/webm"].includes(f.type)) { setError("Format non pris en charge : utilisez un fichier .mp4 ou .webm."); return; }
    if (f.size > 20 * 1024 * 1024) { setError("Vidéo trop lourde (20 Mo maximum). Raccourcissez-la ou compressez-la."); return; }
    setBusy(true);
    const supabase = createClient();
    const ext = f.type === "video/webm" ? "webm" : "mp4";
    const path = `${tenantId}/video-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("tenant-assets").upload(path, f, { contentType: f.type });
    if (upErr) setError("Échec de l'envoi : " + upErr.message);
    else setUrl(supabase.storage.from("tenant-assets").getPublicUrl(path).data.publicUrl);
    setBusy(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      {url && (
        <div className="relative inline-block">
          <video src={url} muted loop playsInline autoPlay className="h-32 w-56 rounded-lg border object-cover" />
          <button type="button" onClick={() => setUrl(null)}
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-600 text-xs text-white">×</button>
        </div>
      )}
      <input type="hidden" name={name} value={url ?? ""} />
      <input type="file" accept="video/mp4,video/webm" onChange={onChange} className="block text-sm" />
      <p className="text-xs text-neutral-500">Conseil : 5 à 15 secondes, sans son, moins de 20 Mo. Une vidéo légère s'affiche vite, même en 4G.</p>
      {busy && <p className="text-sm text-neutral-500">Envoi en cours… (patientez, ne fermez pas la page)</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
