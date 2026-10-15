"use client";
import { useMemo, useState, useTransition } from "react";
import { createSale } from "@/app/dashboard/gestion/actions";
import { formatFcfa } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/pos";

type Product = { id: string; name: string; price_fcfa: number; stock_quantity: number };
type Service = { id: string; name: string; price_fcfa: number };
type Line = { key: string; productId?: string; serviceId?: string; name: string; price: number; qty: number };

export default function PosTerminal({
  products, services, promoEnabled,
}: { products: Product[]; services: Service[]; promoEnabled: boolean }) {
  const [tab, setTab] = useState<"products" | "services" | "free">(products.length || !services.length ? "products" : "services");
  const [q, setQ] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState("");
  const [promo, setPromo] = useState("");
  const [payment, setPayment] = useState("cash");
  const [received, setReceived] = useState("");
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [note, setNote] = useState("");
  const [freeName, setFreeName] = useState("");
  const [freePrice, setFreePrice] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const manual = Math.min(subtotal, Math.max(0, parseInt(discount, 10) || 0));
  const total = Math.max(0, subtotal - manual);
  const rec = parseInt(received, 10);
  const change = payment === "cash" && Number.isFinite(rec) ? rec - total : null;

  const shownProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 60),
    [products, q]
  );
  const shownServices = useMemo(
    () => services.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())),
    [services, q]
  );

  function add(l: Omit<Line, "qty">) {
    setLines((prev) => {
      const ex = prev.find((p) => p.key === l.key);
      if (ex) return prev.map((p) => (p.key === l.key ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { ...l, qty: 1 }];
    });
  }
  const setQty = (key: string, qty: number) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(1000, qty)) } : l)));
  const setPrice = (key: string, price: number) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, price: Math.max(0, price) } : l)));
  const remove = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  function addFree() {
    const price = parseInt(freePrice, 10);
    if (freeName.trim().length < 1 || !Number.isFinite(price) || price < 0) { setError("Article libre : indiquez un nom et un prix."); return; }
    setError("");
    add({ key: `free|${freeName.trim()}|${price}`, name: freeName.trim(), price });
    setFreeName(""); setFreePrice("");
  }

  function submit() {
    setError("");
    if (lines.length === 0) { setError("Ajoutez au moins un article."); return; }
    if (payment === "cash" && received && change !== null && change < 0) { setError("Le montant reçu est inférieur au total."); return; }
    start(async () => {
      const r = await createSale({
        items: lines.map((l) => ({ productId: l.productId, serviceId: l.serviceId, name: l.name, price: l.price, qty: l.qty })),
        payment, received: payment === "cash" && received ? rec : null,
        customerName: cName, customerPhone: cPhone, discount: manual, promo: promo || undefined, note,
      });
      if (r && "error" in r) setError(r.error);
    });
  }

  const tabBtn = (k: typeof tab, label: string) => (
    <button type="button" onClick={() => setTab(k)}
      className={`rounded-full border px-3 py-1.5 text-sm ${tab === k ? "bg-neutral-900 text-white" : "bg-white"}`}>{label}</button>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="space-y-3 lg:col-span-3">
        <div className="flex flex-wrap gap-2">
          {tabBtn("products", "Produits")}
          {services.length > 0 && tabBtn("services", "Services")}
          {tabBtn("free", "Article libre")}
        </div>
        {tab !== "free" && (
          <input className="field" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        )}

        {tab === "products" && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {shownProducts.length === 0 && <p className="col-span-full text-sm text-neutral-500">Aucun produit.</p>}
            {shownProducts.map((p) => (
              <button type="button" key={p.id} onClick={() => add({ key: `p|${p.id}`, productId: p.id, name: p.name, price: p.price_fcfa })}
                disabled={p.stock_quantity <= 0}
                className="rounded-xl border bg-white p-3 text-left hover:bg-neutral-50 disabled:opacity-40">
                <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                <p className="mt-1 text-sm font-bold">{formatFcfa(p.price_fcfa)}</p>
                <p className={`text-xs ${p.stock_quantity <= 0 ? "text-red-600" : "text-neutral-500"}`}>
                  {p.stock_quantity <= 0 ? "Épuisé" : `Stock : ${p.stock_quantity}`}
                </p>
              </button>
            ))}
          </div>
        )}

        {tab === "services" && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {shownServices.map((s) => (
              <button type="button" key={s.id} onClick={() => add({ key: `s|${s.id}`, serviceId: s.id, name: s.name, price: s.price_fcfa })}
                className="rounded-xl border bg-white p-3 text-left hover:bg-neutral-50">
                <p className="line-clamp-2 text-sm font-medium">{s.name}</p>
                <p className="mt-1 text-sm font-bold">{formatFcfa(s.price_fcfa)}</p>
              </button>
            ))}
          </div>
        )}

        {tab === "free" && (
          <div className="dcard space-y-3">
            <p className="text-sm text-neutral-600">Pour vendre quelque chose qui n'est pas dans votre liste de produits.</p>
            <input className="field" placeholder="Nom de l'article" value={freeName} onChange={(e) => setFreeName(e.target.value)} />
            <input className="field" type="number" min={0} placeholder="Prix (FCFA)" value={freePrice} onChange={(e) => setFreePrice(e.target.value)} />
            <button type="button" className="dbtn w-full" onClick={addFree}>Ajouter au panier</button>
          </div>
        )}
      </div>

      <div className="space-y-3 lg:col-span-2">
        <div className="dcard space-y-3">
          <h2 className="font-semibold">Panier</h2>
          {lines.length === 0 && <p className="text-sm text-neutral-500">Touchez un produit pour l'ajouter.</p>}
          {lines.map((l) => (
            <div key={l.key} className="space-y-1 border-b pb-2 text-sm last:border-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{l.name}</p>
                <button type="button" onClick={() => remove(l.key)} className="text-xs text-red-600">Retirer</button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="dbtn-light !px-3 !py-1" onClick={() => setQty(l.key, l.qty - 1)}>−</button>
                <span className="w-8 text-center font-semibold">{l.qty}</span>
                <button type="button" className="dbtn-light !px-3 !py-1" onClick={() => setQty(l.key, l.qty + 1)}>+</button>
                <input type="number" min={0} value={l.price} onChange={(e) => setPrice(l.key, parseInt(e.target.value, 10) || 0)}
                  className="field !w-28" aria-label="Prix unitaire" />
                <span className="ml-auto font-semibold">{formatFcfa(l.price * l.qty)}</span>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Remise (FCFA)</label><input type="number" min={0} className="field" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
            {promoEnabled && <div><label className="label">Code promo</label><input className="field uppercase" value={promo} onChange={(e) => setPromo(e.target.value)} /></div>}
          </div>
          <div className="flex items-center justify-between border-t pt-3 text-lg font-bold">
            <span>Total</span><span>{formatFcfa(total)}</span>
          </div>
          {promo && <p className="text-xs text-neutral-500">La réduction du code promo est calculée à l'encaissement.</p>}
        </div>

        <div className="dcard space-y-3">
          <div>
            <p className="label">Paiement</p>
            <div className="flex flex-wrap gap-2 text-sm">
              {Object.entries(PAYMENT_LABEL).map(([k, v]) => (
                <label key={k} className={`cursor-pointer rounded-full border px-3 py-1.5 ${payment === k ? "bg-neutral-900 text-white" : "bg-white"}`}>
                  <input type="radio" className="hidden" name="pay" checked={payment === k} onChange={() => setPayment(k)} />{v}
                </label>
              ))}
            </div>
          </div>
          {payment === "cash" && (
            <div>
              <label className="label">Montant reçu (FCFA)</label>
              <input type="number" min={0} className="field" value={received} onChange={(e) => setReceived(e.target.value)} />
              {change !== null && (
                <p className={`mt-1 text-sm font-semibold ${change < 0 ? "text-red-600" : "text-green-700"}`}>
                  {change < 0 ? `Il manque ${formatFcfa(-change)}` : `À rendre : ${formatFcfa(change)}`}
                </p>
              )}
            </div>
          )}
          <details>
            <summary className="cursor-pointer text-sm font-medium">Client et note (facultatif)</summary>
            <div className="mt-2 space-y-2">
              <input className="field" placeholder="Nom du client" value={cName} onChange={(e) => setCName(e.target.value)} />
              <input className="field" type="tel" placeholder="Téléphone (pour retrouver ses achats)" value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
              <input className="field" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </details>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="button" className="dbtn w-full !py-3 text-base" disabled={pending || lines.length === 0} onClick={submit}>
            {pending ? "Enregistrement…" : `Encaisser ${formatFcfa(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
