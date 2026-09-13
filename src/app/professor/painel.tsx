"use client";

import { useState } from "react";

type Materia = {
  id: string;
  nome: string;
  permiteExtra: boolean;
  capPontoExtra: number;
};

type Missao = {
  id: string;
  titulo: string;
  valor: number;
  materia: { nome: string };
  aluno: { nome: string; matricula: string };
};

export default function ProfessorPainel({
  materiasIniciais,
  missoesIniciais
}: {
  materiasIniciais: Materia[];
  missoesIniciais: Missao[];
}) {
  const [materias, setMaterias] = useState(materiasIniciais);
  const [missoes, setMissoes] = useState(missoesIniciais);
  const [totpPorMissao, setTotpPorMissao] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Lançamento de nota
  const [alunoId, setAlunoId] = useState("");
  const [materiaSelecionada, setMateriaSelecionada] = useState("");
  const [tipo, setTipo] = useState<"ATIVIDADE" | "PARCIAL" | "BIMESTRAL">("ATIVIDADE");
  const [valor, setValor] = useState("");
  const [bimestre, setBimestre] = useState("1");
  const [atividadeTotal, setAtividadeTotal] = useState("");

  async function decidirMissao(missaoId: string, decisao: "APROVADO" | "NEGADO") {
    setMensagem(null);
    const totp = totpPorMissao[missaoId];
    if (!totp || totp.length !== 6) {
      setMensagem("Digite o código TOTP de 6 dígitos para decidir esta missão.");
      return;
    }

    const res = await fetch("/api/missoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missaoId, decisao, totp, bimestre: 1 })
    });

    const data = await res.json();
    if (!res.ok) {
      setMensagem(data.error ?? "Erro ao decidir missão.");
      return;
    }

    setMissoes((prev) => prev.filter((m) => m.id !== missaoId));
    setMensagem(`Missão ${decisao.toLowerCase()} com sucesso.`);
  }

  async function lancarNota(e: React.FormEvent) {
    e.preventDefault();
    setMensagem(null);

    const res = await fetch("/api/notas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alunoId,
        materiaId: materiaSelecionada,
        tipo,
        valor: parseFloat(valor),
        bimestre: parseInt(bimestre),
        atividadeTotal: atividadeTotal ? parseInt(atividadeTotal) : undefined
      })
    });

    const data = await res.json();
    setMensagem(res.ok ? "Nota lançada e progresso atualizado!" : data.error);
  }

  async function togglePermiteExtra(materiaId: string, valorAtual: boolean) {
    setMaterias((prev) =>
      prev.map((m) => (m.id === materiaId ? { ...m, permiteExtra: !valorAtual } : m))
    );

    const res = await fetch(`/api/materias/${materiaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permiteExtra: !valorAtual })
    });

    if (!res.ok) {
      // reverte em caso de erro
      setMaterias((prev) =>
        prev.map((m) => (m.id === materiaId ? { ...m, permiteExtra: valorAtual } : m))
      );
      const data = await res.json();
      setMensagem(data.error ?? "Erro ao atualizar matéria.");
    }
  }

  async function alterarCapMateria(materiaId: string, novoCap: number) {
    setMaterias((prev) =>
      prev.map((m) => (m.id === materiaId ? { ...m, capPontoExtra: novoCap } : m))
    );

    const res = await fetch(`/api/materias/${materiaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capPontoExtra: novoCap })
    });

    if (!res.ok) {
      const data = await res.json();
      setMensagem(data.error ?? "Erro ao atualizar cap da matéria.");
    }
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {mensagem && (
        <div className="lg:col-span-12 rounded-[28px] glass p-3 text-sm text-ink">{mensagem}</div>
      )}

      <section className="lg:col-span-4 flex flex-col gap-4">
        <h2 className="font-semibold text-ink">Minhas matérias</h2>
        {materias.map((m) => (
          <div key={m.id} className="glass rounded-[28px] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span>{m.nome}</span>
              <button
                onClick={() => togglePermiteExtra(m.id, m.permiteExtra)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  m.permiteExtra ? "bg-lime text-ink" : "bg-slate-200 text-slate-500"
                }`}
              >
                {m.permiteExtra ? "Extra permitido" : "Extra bloqueado"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.1}
                value={m.capPontoExtra}
                disabled={!m.permiteExtra}
                onChange={(e) => alterarCapMateria(m.id, parseFloat(e.target.value))}
                className="flex-1 accent-blue"
              />
              <span className="text-xs text-slate-500 w-8">{m.capPontoExtra.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="lg:col-span-8 flex flex-col gap-4">
        <h2 className="font-semibold text-ink">Missões aguardando aprovação</h2>
        {missoes.map((m) => (
          <div key={m.id} className="glass rounded-[28px] p-4 flex flex-wrap items-center gap-3 justify-between">
            <div>
              <p className="font-medium">{m.titulo}</p>
              <p className="text-xs text-slate-500">
                {m.aluno.nome} ({m.aluno.matricula}) — {m.materia.nome} — +{m.valor.toFixed(1)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                maxLength={6}
                placeholder="TOTP"
                value={totpPorMissao[m.id] ?? ""}
                onChange={(e) => setTotpPorMissao((prev) => ({ ...prev, [m.id]: e.target.value }))}
                className="w-24 rounded-full px-3 py-1 border border-slate-200 text-sm"
              />
              <button
                onClick={() => decidirMissao(m.id, "APROVADO")}
                className="rounded-full bg-lime text-ink text-xs font-semibold px-3 py-1"
              >
                Aprovar
              </button>
              <button
                onClick={() => decidirMissao(m.id, "NEGADO")}
                className="rounded-full bg-red-100 text-red-600 text-xs font-semibold px-3 py-1"
              >
                Negar
              </button>
            </div>
          </div>
        ))}
        {missoes.length === 0 && <p className="text-sm text-slate-400">Nenhuma missão pendente.</p>}

        <h2 className="font-semibold text-ink mt-4">Lançar nota</h2>
        <form onSubmit={lancarNota} className="glass rounded-[28px] p-4 grid sm:grid-cols-2 gap-3">
          <input
            placeholder="ID do aluno"
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
            className="rounded-full px-4 py-2 border border-slate-200"
            required
          />
          <select
            value={materiaSelecionada}
            onChange={(e) => setMateriaSelecionada(e.target.value)}
            className="rounded-full px-4 py-2 border border-slate-200"
            required
          >
            <option value="">Matéria</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            className="rounded-full px-4 py-2 border border-slate-200"
          >
            <option value="ATIVIDADE">Atividade</option>
            <option value="PARCIAL">Parcial</option>
            <option value="BIMESTRAL">Bimestral</option>
          </select>
          <input
            placeholder="Valor (0-10)"
            type="number"
            step="0.1"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="rounded-full px-4 py-2 border border-slate-200"
            required
          />
          <input
            placeholder="Bimestre (1-4)"
            type="number"
            min={1}
            max={4}
            value={bimestre}
            onChange={(e) => setBimestre(e.target.value)}
            className="rounded-full px-4 py-2 border border-slate-200"
          />
          {tipo === "ATIVIDADE" && (
            <input
              placeholder="Total de atividades do bimestre"
              type="number"
              value={atividadeTotal}
              onChange={(e) => setAtividadeTotal(e.target.value)}
              className="rounded-full px-4 py-2 border border-slate-200"
            />
          )}
          <button type="submit" className="sm:col-span-2 rounded-full bg-blue text-white font-semibold py-2">
            Lançar nota
          </button>
        </form>
      </section>
    </div>
  );
}
