"use client";

import { motion } from "framer-motion";

type Props = {
  materiaNome: string;
  atividadeFeita: number;
  atividadeTotal: number;
  parcialFeita: boolean;
  bimestralFeita: boolean;
  percentual: number;
};

function Etapa({ ativo, label }: { ativo: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`h-3 w-3 rounded-full transition-colors duration-300 ${
          ativo ? "bg-lime" : "bg-slate-300"
        }`}
      />
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
}

export default function ProgressoFluido({
  materiaNome,
  atividadeFeita,
  atividadeTotal,
  parcialFeita,
  bimestralFeita,
  percentual
}: Props) {
  return (
    <div className="glass rounded-[28px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">{materiaNome}</h3>
        <span className="text-sm font-medium text-blue">{percentual}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lime to-blue"
          initial={{ width: "0%" }}
          animate={{ width: `${percentual}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between px-2">
        <Etapa ativo={atividadeTotal > 0 && atividadeFeita >= atividadeTotal} label={`Ativ. ${atividadeFeita}/${atividadeTotal}`} />
        <div className="flex-1 h-px bg-slate-300 mx-1" />
        <Etapa ativo={parcialFeita} label="Parcial" />
        <div className="flex-1 h-px bg-slate-300 mx-1" />
        <Etapa ativo={bimestralFeita} label="Bimestral" />
      </div>
    </div>
  );
}
