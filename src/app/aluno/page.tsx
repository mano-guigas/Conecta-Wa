import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProgressoFluido from "@/components/ProgressoFluido";
import Pomodoro from "@/components/Pomodoro";
import TutorWaldemarButton from "@/components/TutorWaldemarButton";
import { calcularFrequencia } from "@/lib/frequencia";

export default async function AlunoPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;

  const aluno = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const progresso = await prisma.progressoMateria.findMany({
    where: { alunoId: userId, bimestre: 1 },
    include: { materia: true }
  });

  const boletim = await prisma.boletimOficial.findMany({
    where: { userId, bimestre: 1 },
    include: { materia: true }
  });

  const missoesPendentes = await prisma.missaoExtra.count({
    where: { alunoId: userId, status: { in: ["PENDENTE", "ENVIADO"] } }
  });

  return (
    <div className="min-h-screen bg-white p-4 lg:p-10 lg:grid lg:grid-cols-12 lg:gap-6">
      <header className="lg:col-span-12 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Olá, {aluno.nome.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 text-sm">
            {aluno.serie}º ano — Turma {aluno.turma ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="glass rounded-[28px] px-4 py-2 text-sm font-semibold text-lime">
            🔥 {aluno.streak} dias
          </span>
          <span className="glass rounded-[28px] px-4 py-2 text-sm font-semibold text-blue">
            ⭐ {aluno.xp} XP
          </span>
        </div>
      </header>

      <section className="lg:col-span-4 flex flex-col gap-4">
        <div className="glass rounded-[28px] p-6 flex flex-col items-center gap-4">
          <Pomodoro />
          <p className="text-xs text-slate-400 text-center">
            25 minutos de foco total, sem distrações.
          </p>
        </div>

        <div className="glass rounded-[28px] p-6">
          <h2 className="font-semibold mb-2">Missões Extras</h2>
          <p className="text-sm text-slate-500">
            Você tem <strong>{missoesPendentes}</strong> missão(ões) em análise.
          </p>
        </div>
      </section>

      <section className="lg:col-span-8 flex flex-col gap-4">
        <h2 className="font-semibold text-lg text-ink">Boletim — Progresso por Matéria</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {progresso.map((p) => (
            <ProgressoFluido
              key={p.id}
              materiaNome={p.materia.nome}
              atividadeFeita={p.atividadeFeita}
              atividadeTotal={p.atividadeTotal}
              parcialFeita={p.parcialFeita}
              bimestralFeita={p.bimestralFeita}
              percentual={p.percentual}
            />
          ))}
          {progresso.length === 0 && (
            <p className="text-sm text-slate-400 col-span-2">
              Nenhum progresso lançado ainda para este bimestre.
            </p>
          )}
        </div>

        <h2 className="font-semibold text-lg text-ink mt-4">Frequência</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {boletim.map((b) => {
            const { frequencia, riscoReprovacaoFalta } = calcularFrequencia(b.faltas, b.totalAulas);
            return (
              <div key={b.id} className="glass rounded-[28px] p-4 flex items-center justify-between">
                <span className="font-medium">{b.materia.nome}</span>
                <span className={riscoReprovacaoFalta ? "text-red-500 font-bold" : "text-lime font-bold"}>
                  {frequencia}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <TutorWaldemarButton />
    </div>
  );
}
