"use client";
export default function PrintButton({ label = "Imprimer" }: { label?: string }) {
  return <button type="button" onClick={() => window.print()} className="dbtn">{label}</button>;
}
