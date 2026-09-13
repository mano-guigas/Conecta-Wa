import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exigirTotpOuFalhar } from "@/lib/totp";
import { z } from "zod";

const bodySchema = z.object({
  totp: z.string().length(6),
  anoLetivo: z.number().int()
});

/**
 * Regra nova #5 — Encerramento do Ano Letivo (apenas FUNDADOR, exige TOTP):
 * - 3º ano: arquiva em HistoricoFinal, ativo=false, remove da turma ativa
 *   (não deleta do banco).
 * - 1º e 2º ano: promove automaticamente (serie++), mantém histórico,
 *   reseta ProgressoMateria para o novo ano.
 * - BoletimOficial é sempre mantido para histórico.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.cargo !== "FUNDADOR") {
    return NextResponse.json({ error: "Apenas o FUNDADOR pode encerrar o ano letivo." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
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
      acao: "ENCERRAR_ANO_LETIVO",
      metadata: { anoLetivo: parsed.data.anoLetivo }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  const alunos = await prisma.user.findMany({
    where: { cargo: "ALUNO", ativo: true }
  });

  const resultado = { arquivados: 0, promovidos: 0 };

  await prisma.$transaction(async (tx) => {
    for (const aluno of alunos) {
      if (aluno.serie === 3) {
        await tx.historicoFinal.create({
          data: {
            alunoId: aluno.id,
            nome: aluno.nome,
            serie: aluno.serie,
            anoLetivo: parsed.data.anoLetivo
          }
        });
        await tx.user.update({
          where: { id: aluno.id },
          data: { ativo: false, turma: null }
        });
        resultado.arquivados++;
      } else if (aluno.serie === 1 || aluno.serie === 2) {
        await tx.user.update({
          where: { id: aluno.id },
          data: { serie: aluno.serie + 1 }
        });
        // Reseta o progresso (BoletimOficial é preservado para histórico)
        await tx.progressoMateria.deleteMany({ where: { alunoId: aluno.id } });
        resultado.promovidos++;
      }
    }
  });

  return NextResponse.json({ ok: true, ...resultado });
}
