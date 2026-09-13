"use client";

import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";

export default function ImportCsvBox({ endpoint }: { endpoint: string }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [totp, setTotp] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function enviar() {
    if (!arquivo || totp.length !== 6) {
      setResultado("Selecione um CSV e digite o código TOTP de 6 dígitos.");
      return;
    }

    const formData = new FormData();
    formData.append("csv", arquivo);
    formData.append("totp", totp);

    const res = await fetch(endpoint, { method: "POST", body: formData });
    const data = await res.json();

    setResultado(
      res.ok
        ? `${data.importados} linha(s) importada(s). ${data.falhas?.length ?? 0} falha(s).`
        : data.error
    );
  }

  return (
    <div className="glass rounded-[28px] p-6 flex flex-col gap-4 max-w-lg">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          const file = e.dataTransfer.files?.[0];
          if (file) setArquivo(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-[20px] border-2 border-dashed p-8 flex flex-col items-center gap-2 cursor-pointer transition ${
          arrastando ? "border-blue bg-blue/5" : "border-slate-300"
        }`}
      >
        <UploadCloud className="text-blue" />
        <p className="text-sm text-slate-500 text-center">
          {arquivo ? arquivo.name : "Arraste o CSV aqui ou clique para selecionar"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          hidden
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
        />
      </div>

      <input
        value={totp}
        onChange={(e) => setTotp(e.target.value)}
        maxLength={6}
        placeholder="Código TOTP (6 dígitos)"
        className="rounded-full px-4 py-2 border border-slate-200 text-center tracking-widest"
      />

      <button onClick={enviar} className="rounded-full bg-blue text-white font-semibold py-2">
        Importar
      </button>

      {resultado && <p className="text-sm text-ink">{resultado}</p>}
    </div>
  );
}
