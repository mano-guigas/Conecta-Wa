import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcularPercentualProgresso } from "@/lib/frequencia";
import { z } from "zod";

const lancarSchema = z.object({
  alunoId: z.string(),
  materiaId: z.string(),
  tipo: z.enum(["ATIVIDADE", "PARCIAL", "BIMESTRAL"]),
  valor: z.number().min(0).max(10),
  peso: z.number().min(0).default(1),
  bimestre: z.number().int().min(1).max(4),
  atividadeTotal: z.number().int().min(0).optional() // usado quando tipo = ATIVIDADE
});

// Professor lança nota — atualiza NotaDetalhada e recalcula ProgressoMateria
// automaticamente (regra 6: Atividades 40% + Parcial 30% + Bimestral 30%).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !["PROFESSOR", "GESTAO", "FUNDADOR"].includes(user.cargo)) {
    return NextResponse.json({ error: "Sem permissão para lançar notas." }, { status: 403 });
  }

  const parsed = lancarSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { alunoId, materiaId, tipo, valor, peso, bimestre, atividadeTotal } = parsed.data;

  const nota = await prisma.notaDetalhada.create({
    data: { alunoId, materiaId, tipo, valor, peso, bimestre }
  });

  const progressoAtual = await prisma.progressoMateria.findUnique({
    where: { alunoId_materiaId_bimestre: { alunoId, materiaId, bimestre } }
  });

  const atividadesFeitas =
    tipo === "ATIVIDADE"
      ? (progressoAtual?.atividadeFeita ?? 0) + 1
      : progressoAtual?.atividadeFeita ?? 0;

  const dadosProgresso = {
    atividadeFeita: atividadesFeitas,
    atividadeTotal: atividadeTotal ?? progressoAtual?.atividadeTotal ?? 0,
    parcialFeita: tipo === "PARCIAL" ? true : progressoAtual?.parcialFeita ?? false,
    bimestralFeita: tipo === "BIMESTRAL" ? true : progressoAtual?.bimestralFeita ?? false
  };

  const percentual = calcularPercentualProgresso(dadosProgresso);

  const progresso = await prisma.progressoMateria.upsert({
    where: { alunoId_materiaId_bimestre: { alunoId, materiaId, bimestre } },
    update: { ...dadosProgresso, percentual },
    create: { alunoId, materiaId, bimestre, ...dadosProgresso, percentual }
  });

  return NextResponse.json({ nota, progresso });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const alunoId = searchParams.get("alunoId") ?? (user.cargo === "ALUNO" ? user.id : undefined);
  const bimestre = searchParams.get("bimestre");

  if (!alunoId) return NextResponse.json({ error: "alunoId obrigatório." }, { status: 400 });

  const progresso = await prisma.progressoMateria.findMany({
    where: { alunoId, ...(bimestre ? { bimestre: parseInt(bimestre) } : {}) },
    include: { materia: true }
  });

  return NextResponse.json({ progresso });
}
