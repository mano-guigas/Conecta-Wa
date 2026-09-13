"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pause, Play } from "lucide-react";

const DURACAO_PADRAO = 25 * 60;

export default function Pomodoro() {
  const [aberto, setAberto] = useState(false);
  const [rodando, setRodando] = useState(false);
  const [segundos, setSegundos] = useState(DURACAO_PADRAO);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rodando) {
      intervalRef.current = setInterval(() => {
        setSegundos((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rodando]);

  const minutos = Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0");
  const restoSegundos = (segundos % 60).toString().padStart(2, "0");

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="rounded-[28px] px-5 py-3 bg-ink text-white font-medium hover:opacity-90 transition"
      >
        Iniciar Pomodoro 25min
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink text-white"
          >
            <button
              onClick={() => {
                setAberto(false);
                setRodando(false);
                setSegundos(DURACAO_PADRAO);
              }}
              className="absolute top-6 right-6 p-2 rounded-full glass-dark"
              aria-label="Fechar Pomodoro"
            >
              <X size={20} />
            </button>

            <motion.span
              key={segundos}
              initial={{ scale: 0.98, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl font-bold tabular-nums"
            >
              {minutos}:{restoSegundos}
            </motion.span>

            <p className="mt-4 text-slate-400">Foco Lo-Fi — respire e estude 🌙</p>

            <button
              onClick={() => setRodando((r) => !r)}
              className="mt-8 flex items-center gap-2 rounded-[28px] px-6 py-3 bg-lime text-ink font-semibold"
            >
              {rodando ? <Pause size={18} /> : <Play size={18} />}
              {rodando ? "Pausar" : "Começar"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
