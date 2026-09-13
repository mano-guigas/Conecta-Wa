"use client";

import { useState } from "react";

export default function FundadorPainel({ capAtual }: { capAtual: number }) {
  const [cap, setCap] = useState(capAtual);
  const [totpCap, setTotpCap] = useState("");
  const [mensagemCap, setMensagemCap] = useState<string | null>(null);

  const [totpEncerrar, setTotpEncerrar] = useState("");
  const [confirmarEncerrar, setConfirmarEncerrar] = useState(false);
  const [mensagemEncerrar, setMensagemEncerrar] = useState<string | null>(null);

  async function salvarCap() {
    const res = await fetch("/api/admin/cap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novoCap: cap, totp: totpCap })
    });
    const data = await res.json();
    setMensagemCap(res.ok ? `Cap global atualizado para ${data.novoCap}` : data.error);
  }

  async function encerrarAno() {
    if (!confirmarEncerrar) {
      setConfirmarEncerrar(true);
      setMensagemEncerrar("Clique novamente para confirmar o encerramento do ano letivo.");
      return;
    }

    const res = await fetch("/api/encerrar-ano", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totp: totpEncerrar, anoLetivo: new Date().getFullYear() })
    });
    const data = await res.json();

    setConfirmarEncerrar(false);
    setMensagemEncerrar(
      res.ok
        ? `Ano encerrado: ${data.promovidos} promovido(s), ${data.arquivados} arquivado(s).`
        : data.error
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-[28px] p-6">
        <h2 className="font-semibold text-ink mb-2">Cap global de ponto extra</h2>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.1}
          value={cap}
          onChange={(e) => setCap(parseFloat(e.target.value))}
          className="w-full accent-lime"
        />
        <p className="text-sm text-slate-500 mb-2">Valor atual: {cap.toFixed(1)}</p>
        <input
          value={totpCap}
          onChange={(e) => setTotpCap(e.target.value)}
          maxLength={6}
          placeholder="TOTP"
          className="rounded-full px-4 py-2 border border-slate-200 w-full mb-2 text-center tracking-widest"
        />
        <button onClick={salvarCap} className="rounded-full bg-blue text-white font-semibold py-2 w-full">
          Salvar cap global
        </button>
        {mensagemCap && <p className="text-sm text-ink mt-2">{mensagemCap}</p>}
      </div>

      <div className="glass rounded-[28px] p-6 border-2 border-red-100">
        <h2 className="font-semibold text-red-600 mb-2">⚠️ Encerrar Ano Letivo</h2>
        <p className="text-xs text-slate-500 mb-3">
          3º ano será arquivado em HistoricoFinal. 1º e 2º ano serão promovidos automaticamente.
          Esta ação exige TOTP e confirmação dupla.
        </p>
        <input
          value={totpEncerrar}
          onChange={(e) => setTotpEncerrar(e.target.value)}
          maxLength={6}
          placeholder="TOTP"
          className="rounded-full px-4 py-2 border border-slate-200 w-full mb-2 text-center tracking-widest"
        />
        <button onClick={encerrarAno} className="rounded-full bg-red-500 text-white font-semibold py-2 w-full">
          {confirmarEncerrar ? "Confirmar encerramento" : "Encerrar Ano Letivo"}
        </button>
        {mensagemEncerrar && <p className="text-sm text-ink mt-2">{mensagemEncerrar}</p>}
      </div>
    </div>
  );
}
