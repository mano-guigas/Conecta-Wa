export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import ImportCsvBox from "@/components/ImportCsvBox";
import FundadorPainel from "./painel";

export default async function FundadorPage() {
  const cap = await prisma.config.findUnique({ where: { key: "CAP_GLOBAL" } });
  const logs = await prisma.logSeguranca.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { nome: true, matricula: true } } }
  });

  return (
    <div className="min-h-screen bg-white p-4 lg:p-10">
      <h1 className="text-2xl font-bold text-ink mb-1">Painel do Fundador</h1>
      <p className="text-sm text-slate-500 mb-6">Acesso ROOT — todas as ações exigem TOTP.</p>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 flex flex-col gap-6">
          <FundadorPainel capAtual={cap ? parseFloat(cap.value) : 1.0} />

          <div>
            <h2 className="font-semibold text-ink mb-3">Importar boletim (CSV)</h2>
            <ImportCsvBox endpoint="/api/admin/import-boletim" />
          </div>
        </div>

        <div className="lg:col-span-6">
          <h2 className="font-semibold text-ink mb-3">Logs de Segurança (últimos 30)</h2>
          <div className="glass rounded-[28px] p-4 max-h-[600px] overflow-y-auto flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="text-xs border-b border-slate-100 pb-2">
                <span className="font-semibold text-ink">{log.acao}</span>{" "}
                <span className="text-slate-500">
                  — {log.user?.nome ?? "sistema"} ({log.user?.matricula ?? "-"}) —{" "}
                  {log.createdAt.toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-slate-400">Nenhum log ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
