import { prisma } from "@/lib/prisma";
import ImportCsvBox from "@/components/ImportCsvBox";

export default async function GestaoPage() {
  const totalAlunos = await prisma.user.count({ where: { cargo: "ALUNO", ativo: true } });
  const inativos = await prisma.user.count({ where: { cargo: "ALUNO", ativo: false } });

  const notas = await prisma.boletimOficial.findMany({ select: { nota: true, materiaId: true } });
  const mediaGeral =
    notas.length > 0 ? notas.reduce((acc, n) => acc + n.nota, 0) / notas.length : 0;

  const alunosRisco = await prisma.boletimOficial.groupBy({
    by: ["userId"],
    where: { faltas: { gt: 0 } },
    _sum: { faltas: true, totalAulas: true }
  });

  const emRiscoPorFalta = alunosRisco.filter((a) => {
    const faltas = a._sum.faltas ?? 0;
    const total = a._sum.totalAulas ?? 0;
    if (total === 0) return false;
    return 100 - (faltas / total) * 100 < 75;
  }).length;

  return (
    <div className="min-h-screen bg-white p-4 lg:p-10">
      <h1 className="text-2xl font-bold text-ink mb-6">Painel de Gestão</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card titulo="Alunos ativos" valor={totalAlunos} cor="text-blue" />
        <Card titulo="Arquivados (evasão/formados)" valor={inativos} cor="text-slate-500" />
        <Card titulo="Média geral" valor={mediaGeral.toFixed(1)} cor="text-lime" />
        <Card titulo="Risco por frequência" valor={emRiscoPorFalta} cor="text-red-500" />
      </div>

      <h2 className="font-semibold text-ink mb-3">Importar boletim (CSV)</h2>
      <ImportCsvBox endpoint="/api/admin/import-boletim" />
    </div>
  );
}

function Card({ titulo, valor, cor }: { titulo: string; valor: string | number; cor: string }) {
  return (
    <div className="glass rounded-[28px] p-5">
      <p className="text-xs text-slate-500">{titulo}</p>
      <p className={`text-3xl font-bold ${cor}`}>{valor}</p>
    </div>
  );
}
