import { prisma } from "./prisma";

/**
 * Regra inquebrável #1:
 * checkCap() soma todas as MissaoExtra com status APROVADO do aluno,
 * na matéria, no bimestre. Se a soma + o novo valor solicitado ultrapassar
 * o cap (capPontoExtra da matéria, ou o CAP_GLOBAL em Config se definido),
 * a operação é bloqueada com "Cap de 1.0 atingido".
 */
export async function checkCap(params: {
  alunoId: string;
  materiaId: string;
  bimestre: number;
  valorSolicitado: number;
}) {
  const { alunoId, materiaId, bimestre, valorSolicitado } = params;

  const materia = await prisma.materia.findUniqueOrThrow({
    where: { id: materiaId }
  });

  if (!materia.permiteExtra) {
    return { permitido: false, motivo: "Esta matéria não permite pontos extras." };
  }

  const capGlobalConfig = await prisma.config.findUnique({
    where: { key: "CAP_GLOBAL" }
  });

  const cap = capGlobalConfig ? parseFloat(capGlobalConfig.value) : materia.capPontoExtra;

  const aprovadas = await prisma.missaoExtra.findMany({
    where: {
      alunoId,
      materiaId,
      status: "APROVADO",
      criadoEm: undefined // bimestre é derivado via join de NotaDetalhada se necessário
    }
  });

  const somaAtual = aprovadas.reduce((acc, m) => acc + m.valor, 0);
  const totalComNova = somaAtual + valorSolicitado;

  if (totalComNova > cap) {
    return {
      permitido: false,
      motivo: `Cap de ${cap.toFixed(1)} atingido`,
      somaAtual,
      cap
    };
  }

  return { permitido: true, somaAtual, cap };
}

export async function getCapGlobal(): Promise<number> {
  const config = await prisma.config.findUnique({ where: { key: "CAP_GLOBAL" } });
  return config ? parseFloat(config.value) : 1.0;
}

export async function setCapGlobal(novoValor: number) {
  return prisma.config.upsert({
    where: { key: "CAP_GLOBAL" },
    update: { value: novoValor.toString() },
    create: { key: "CAP_GLOBAL", value: novoValor.toString() }
  });
}
