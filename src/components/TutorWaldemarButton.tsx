"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X } from "lucide-react";

export default function TutorWaldemarButton() {
  const [aberto, setAberto] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function perguntar() {
    if (!pergunta.trim()) return;
    setCarregando(true);
    setResposta("");

    const res = await fetch("/api/ai/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pergunta })
    });

    if (!res.body) {
      setCarregando(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let textoAcumulado = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);

      for (const linha of chunk.split("\n")) {
        if (!linha.startsWith("data: ")) continue;
        const dado = linha.replace("data: ", "").trim();
        if (dado === "[DONE]") continue;
        try {
          const json = JSON.parse(dado);
          const delta = json.choices?.[0]?.delta?.content ?? "";
          textoAcumulado += delta;
          setResposta(textoAcumulado);
        } catch {
          // ignora chunks parciais/keep-alive
        }
      }
    }

    setCarregando(false);
  }

  return (
    <>
      <motion.button
        onClick={() => setAberto(true)}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue text-white px-5 py-3 shadow-lg"
      >
        <Sparkles size={18} />
        Perguntar ao Waldemar IA
      </motion.button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-24 right-6 z-40 w-[90vw] max-w-sm glass rounded-[28px] p-4 flex flex-col gap-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-1">
                <Sparkles size={16} className="text-blue" /> Tutor Waldemar
              </h4>
              <button onClick={() => setAberto(false)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto text-sm text-ink whitespace-pre-wrap">
              {resposta || (carregando ? "Pensando..." : "Pergunte algo sobre o ENEM ou suas matérias!")}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && perguntar()}
                placeholder="Ex: como calcular a redação nota 1000?"
                className="flex-1 rounded-full px-4 py-2 bg-white/80 text-sm outline-none"
              />
              <button
                onClick={perguntar}
                disabled={carregando}
                className="rounded-full bg-ink text-white p-2 disabled:opacity-50"
                aria-label="Enviar"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
