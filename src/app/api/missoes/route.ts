import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkCap } from "@/lib/cap";
import { exigirTotpOuFalhar } from "@/lib/totp";
import { z } from "zod";

const criarSchema = z.object({
  titulo: z.string().min(3),
  valor: z.number().min(0.1).max(0.5),
  materiaId: z.string()
});

const decidirSchema = z.object({
  missaoId: z.string(),
  decisao: z.enum(["APROVADO", "NEGADO"]),
  totp: z.string().length(6),
  bimestre: z.number().int().min(1).max(4)
});

// Aluno cria/envia uma missão extra
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = criarSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const missao = await prisma.missaoExtra.create({
    data: {
      titulo: parsed.data.titulo,
      valor: parsed.data.valor,
      materiaId: parsed.data.materiaId,
      alunoId: user.id,
      status: "ENVIADO"
    }
  });

  return NextResponse.json({ missao });
}

// Professor/Gestão/Fundador aprova ou nega, exigindo TOTP (regra 4) e checkCap (regra 1)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !["PROFESSOR", "GESTAO", "FUNDADOR"].includes(user.cargo)) {
    return NextResponse.json({ error: "Sem permissão para aprovar missões." }, { status: 403 });
  }

  const parsed = decidirSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!dbUser.totpSecret) {
    return NextResponse.json({ error: "TOTP não configurado para este usuário." }, { status: 400 });
  }

  try {
    await exigirTotpOuFalhar({
      userId: user.id,
      token: parsed.data.totp,
      secret: dbUser.totpSecret,
      acao: `MISSAO_${parsed.data.decisao}`,
      metadata: { missaoId: parsed.data.missaoId }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  const missao = await prisma.missaoExtra.findUniqueOrThrow({ where: { id: parsed.data.missaoId } });

  if (parsed.data.decisao === "APROVADO") {
    const resultadoCap = await checkCap({
      alunoId: missao.alunoId,
      materiaId: missao.materiaId,
      bimestre: parsed.data.bimestre,
      valorSolicitado: missao.valor
    });

    if (!resultadoCap.permitido) {
      return NextResponse.json({ error: resultadoCap.motivo }, { status: 409 });
    }
  }

  const atualizada = await prisma.missaoExtra.update({
    where: { id: missao.id },
    data: { status: parsed.data.decisao, aprovadoPor: user.id }
  });

  return NextResponse.json({ missao: atualizada });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const where = user.cargo === "ALUNO" ? { alunoId: user.id } : {};
  const missoes = await prisma.missaoExtra.findMany({
    where,
    include: { materia: true, aluno: { select: { nome: true, matricula: true } } },
    orderBy: { criadoEm: "desc" }
  });

  return NextResponse.json({ missoes });
}
