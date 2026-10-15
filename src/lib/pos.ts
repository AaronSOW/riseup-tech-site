export const PAYMENT_LABEL: Record<string, string> = {
  cash: "Espèces", wave: "Wave", orange_money: "Orange Money", card: "Carte bancaire", other: "Autre",
};

// Numéro au format international sans « + » pour les liens WhatsApp (Sénégal par défaut).
export function waNumber(phone: string | null | undefined) {
  const d = String(phone ?? "").replace(/[^0-9]/g, "");
  if (d.length === 9) return "221" + d;
  return d;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Africa/Dakar", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
