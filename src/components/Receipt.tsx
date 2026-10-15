import { formatFcfa } from "@/lib/format";

export type ReceiptData = {
  shop: { name: string; logo?: string | null; address?: string | null; phone?: string | null };
  title: string;
  date: string;
  customer?: string | null;
  lines: { name: string; qty: number; unit: number; total: number }[];
  subtotal: number; discount: number; promo?: string | null; total: number;
  payment: string; received?: number | null; change?: number | null;
  footer?: string | null; refunded?: boolean; format: "ticket" | "a4";
};

export default function Receipt(d: ReceiptData) {
  const ticket = d.format === "ticket";
  return (
    <div className={`receipt mx-auto border bg-white p-4 text-neutral-900 print:border-0 ${ticket ? "max-w-[80mm] text-[12px]" : "max-w-2xl text-sm"}`}>
      <div className="text-center">
        {d.shop.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.shop.logo} alt="" className="mx-auto mb-2 h-12 w-auto" />
        )}
        <p className="text-base font-bold">{d.shop.name}</p>
        {d.shop.address && <p>{d.shop.address}</p>}
        {d.shop.phone && <p>Tél : {d.shop.phone}</p>}
      </div>
      <div className="my-3 border-y border-dashed border-neutral-400 py-2 text-center">
        <p className="font-semibold">{d.title}</p>
        <p>{d.date}</p>
        {d.customer && <p>Client : {d.customer}</p>}
        {d.refunded && <p className="mt-1 font-bold uppercase text-red-600">Remboursé</p>}
      </div>
      <table className="w-full">
        <tbody>
          {d.lines.map((l, i) => (
            <tr key={i} className="align-top">
              <td className="py-0.5 pr-2">{l.name}<br /><span className="text-neutral-500">{l.qty} × {formatFcfa(l.unit)}</span></td>
              <td className="py-0.5 text-right font-medium">{formatFcfa(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 space-y-0.5 border-t border-dashed border-neutral-400 pt-2">
        {d.discount > 0 && (
          <>
            <div className="flex justify-between"><span>Sous-total</span><span>{formatFcfa(d.subtotal)}</span></div>
            <div className="flex justify-between"><span>Remise{d.promo ? ` (${d.promo})` : ""}</span><span>- {formatFcfa(d.discount)}</span></div>
          </>
        )}
        <div className="flex justify-between text-base font-bold"><span>TOTAL</span><span>{formatFcfa(d.total)}</span></div>
        <div className="flex justify-between"><span>Paiement</span><span>{d.payment}</span></div>
        {d.received != null && <div className="flex justify-between"><span>Reçu</span><span>{formatFcfa(d.received)}</span></div>}
        {d.change != null && d.change > 0 && <div className="flex justify-between"><span>Monnaie rendue</span><span>{formatFcfa(d.change)}</span></div>}
      </div>
      <p className="mt-4 whitespace-pre-line text-center">{d.footer || "Merci de votre confiance !"}</p>
    </div>
  );
}
