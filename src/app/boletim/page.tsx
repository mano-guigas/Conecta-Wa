import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProgressoFluido from "@/components/ProgressoFluido";
import { calcularFrequencia } from "@/lib/frequencia";

export default async function BoletimPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;

  const boletim = await prisma.boletimOficial.findMany({
    where: { userId },
    include: { materia: { include: { professor: true } } },
    orderBy: [{ bimestre: "asc" }, { materia: { nome: "asc" } }]
  });

  const progresso = await prisma.progressoMateria.findMany({
    where: { alunoId: userId },
    include: { materia: true }
  });

  return (
    <div className="min-h-screen bg-white p-4 lg:p-10">
      <h1 className="text-2xl font-bold text-ink mb-6">Meu Boletim</h1>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-3">
          {boletim.map((b) => {
            const { frequencia, riscoReprovacaoFalta } = calcularFrequencia(b.faltas, b.totalAulas);
            return (
              <div key={b.id} className="glass rounded-[28px] p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{b.materia.nome}</p>
                  <p className="text-xs text-slate-500">
                    Bimestre {b.bimestre} · Prof. {b.materia.professor?.nome ?? "a definir"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-blue">{b.nota.toFixed(1)}</span>
                  <span className={`text-sm font-semibold ${riscoReprovacaoFalta ? "text-red-500" : "text-lime"}`}>
                    {frequencia}% freq.
                  </span>
                </div>
              </div>
            );
          })}
          {boletim.length === 0 && <p className="text-sm text-slate-400">Nenhum boletim lançado ainda.</p>}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          <h2 className="font-semibold text-ink">Progresso detalhado</h2>
          {progresso.map((p) => (
            <ProgressoFluido
              key={p.id}
              materiaNome={`${p.materia.nome} (B${p.bimestre})`}
              atividadeFeita={p.atividadeFeita}
              atividadeTotal={p.atividadeTotal}
              parcialFeita={p.parcialFeita}
              bimestralFeita={p.bimestralFeita}
              percentual={p.percentual}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
