"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatFcfa, whatsappLink } from "@/lib/format";

type Done = {
  orderId: string; orderNumber: number; total: number; method: string;
  paymentLink: string | null; instructions: string | null;
};

export default function CheckoutForm({
  methods, whatsapp, shopName, promoEnabled = false,
}: { methods: { id: string; label: string }[]; whatsapp: string | null; shopName: string; promoEnabled?: boolean }) {
  const { items, total, clear } = useCart();
  const [method, setMethod] = useState(methods[0]?.id ?? "");
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [ref, setRef] = useState("");
  const [declared, setDeclared] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoMsg, setPromoMsg] = useState("");

  async function applyPromo() {
    setPromoMsg(""); setApplied(null);
    if (!promoCode.trim()) return;
    const res = await fetch("/api/promo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode, subtotal: total }),
    });
    const data = await res.json();
    if (!res.ok) setPromoMsg(data.error || "Code invalide");
    else setApplied({ code: promoCode.trim().toUpperCase(), discount: data.discount });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name, customerPhone: form.phone,
          customerAddress: form.address || undefined, customerNote: form.note || undefined,
          paymentMethod: method,
          promoCode: applied ? applied.code : undefined,
          items: items.map((i) => ({ productId: i.productId, quantity: i.qty, variant: i.variant })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la commande");
      clear();
      setDone(data);
      if (data.method === "whatsapp" && whatsapp) {
        window.location.href = whatsappLink(
          whatsapp,
          `Bonjour ${shopName}, commande n°${data.orderNumber} de ${form.name} : ${formatFcfa(data.total)}.`
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function declare() {
    if (!done) return;
    const res = await fetch("/api/orders/declare", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: done.orderId, reference: ref }),
    });
    if (res.ok) setDeclared(true);
  }

  if (done) {
    const online = done.method === "wave" || done.method === "orange_money";
    return (
      <div className="mx-auto max-w-md space-y-5 py-6 text-center">
        <h1 className="font-heading text-2xl font-bold">Commande n°{done.orderNumber} enregistrée ✓</h1>
        <p>Montant : <strong>{formatFcfa(done.total)}</strong></p>
        {online && done.paymentLink && (
          <div className="space-y-3 rounded-card bg-surface p-4 text-left">
            <p className="text-sm">Payez exactement <strong>{formatFcfa(done.total)}</strong> avec le lien ci-dessous :</p>
            <a href={done.paymentLink} target="_blank" rel="noreferrer" className="btn w-full">
              Payer avec {done.method === "wave" ? "Wave" : "Orange Money"}
            </a>
            {done.instructions && <p className="text-sm text-muted">{done.instructions}</p>}
            {!declared ? (
              <div className="space-y-2 border-t pt-3">
                <p className="text-sm">Après le paiement, indiquez votre référence de transaction (facultatif) :</p>
                <input className="field" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Référence ou numéro" />
                <button className="btn-outline w-full" onClick={declare}>J'ai payé</button>
              </div>
            ) : (
              <p className="text-sm font-medium text-green-700">Merci ! Le commerçant va vérifier votre paiement.</p>
            )}
            <p className="text-xs text-muted">Votre commande sera marquée « payée » uniquement après vérification par le commerçant.</p>
          </div>
        )}
        {done.method === "cash_on_delivery" && <p className="text-sm text-muted">Vous paierez à la livraison. Le commerçant vous contactera.</p>}
        <Link href="/" className="btn-outline">Retour à l'accueil</Link>
      </div>
    );
  }

  if (items.length === 0)
    return <div className="py-16 text-center"><p className="mb-4 text-muted">Votre panier est vide.</p><Link href="/produits" className="btn">Voir les produits</Link></div>;

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-5">
      <h1 className="font-heading text-2xl font-bold">Finaliser la commande</h1>
      <div className="rounded-card bg-surface p-4 text-sm">
        {items.map((i) => (
          <div key={i.key} className="flex justify-between py-0.5">
            <span>{i.qty} × {i.name}{i.variant ? ` (${i.variant})` : ""}</span>
            <span>{formatFcfa(i.qty * i.price)}</span>
          </div>
        ))}
        {applied && (
          <div className="flex justify-between py-0.5 text-green-700"><span>Code {applied.code}</span><span>- {formatFcfa(applied.discount)}</span></div>
        )}
        <div className="mt-2 flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{formatFcfa(total - (applied?.discount ?? 0))}</span></div>
      </div>
      {promoEnabled && (
        <div>
          <label className="label">Code promo</label>
          <div className="flex gap-2">
            <input className="field uppercase" value={promoCode} onChange={(e) => { setPromoCode(e.target.value); setApplied(null); }} placeholder="Votre code" />
            <button type="button" className="btn-outline" onClick={applyPromo}>Appliquer</button>
          </div>
          {promoMsg && <p className="mt-1 text-sm text-red-600">{promoMsg}</p>}
          {applied && <p className="mt-1 text-sm text-green-700">Code appliqué ✓</p>}
        </div>
      )}
      <div><label className="label">Nom complet *</label><input required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><label className="label">Téléphone *</label><input required type="tel" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><label className="label">Adresse de livraison</label><input className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      <div><label className="label">Remarque</label><textarea className="field" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
      <div>
        <p className="label">Moyen de paiement</p>
        {methods.length === 0 && <p className="text-sm text-red-600">Aucun moyen de paiement n'est activé pour cette boutique.</p>}
        <div className="space-y-2">
          {methods.map((m) => (
            <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${method === m.id ? "border-primary" : "border-line"}`}>
              <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} />
              {m.label}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={loading || !method}>{loading ? "Envoi…" : "Confirmer la commande"}</button>
    </form>
  );
}
