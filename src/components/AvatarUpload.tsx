"use client";

import { useRef, useState } from "react";

export default function AvatarUpload({ avatarUrlAtual }: { avatarUrlAtual: string | null }) {
  const [preview, setPreview] = useState<string | null>(avatarUrlAtual);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo maior que 2MB. Escolha uma imagem menor.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setEnviando(true);

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
    const data = await res.json();

    setEnviando(false);
    if (res.ok) setPreview(data.avatarUrl);
    else alert(data.error ?? "Erro ao enviar avatar.");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg cursor-pointer flex items-center justify-center"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-400 text-xs">Adicionar foto</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <p className="text-xs text-slate-400">{enviando ? "Enviando..." : "Clique para trocar (máx. 2MB, corte 400x400)"}</p>
    </div>
  );
}
