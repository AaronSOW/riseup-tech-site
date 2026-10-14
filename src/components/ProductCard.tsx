import Link from "next/link";
import { formatFcfa } from "@/lib/format";

const WRAP: Record<string, string> = {
  plain: "",
  bordered: "border border-line p-2 rounded-card",
  shadow: "bg-surface p-2 rounded-card shadow-md",
};

export default function ProductCard({ p, variant = "plain", lift = false }: { p: any; variant?: string; lift?: boolean }) {
  const out = p.stock_status !== "available" || p.stock_quantity <= 0;
  return (
    <Link href={`/produits/${p.id}`} className={`group block ${WRAP[variant] ?? ""} ${lift ? "fx-lift" : ""}`}>
      <div className="relative aspect-square overflow-hidden rounded-card bg-surface">
        {p.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">Pas de photo</div>
        )}
        {out && (
          <span className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white">
            {p.stock_status === "unavailable" ? "Indisponible" : "Épuisé"}
          </span>
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium">{p.name}</h3>
      <p className="mt-0.5 text-sm">
        <span className="font-semibold">{formatFcfa(p.price_fcfa)}</span>
        {p.old_price_fcfa > p.price_fcfa && (
          <span className="ml-2 text-xs text-muted line-through">{formatFcfa(p.old_price_fcfa)}</span>
        )}
      </p>
    </Link>
  );
}
