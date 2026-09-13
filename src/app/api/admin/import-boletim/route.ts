import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exigirTotpOuFalhar } from "@/lib/totp";
import Papa from "papaparse";

/**
 * Espera um CSV com colunas:
 * matricula,codigoMateria,serie,nota,faltas,totalAulas,bimestre
 *
 * Exige TOTP (regra inquebrável 4) e registra em LogSeguranca.
 * Apenas FUNDADOR e GESTAO podem importar.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["FUNDADOR", "GESTAO"].includes(user.cargo)) {
    return NextResponse.json({ error: "Sem permissão para importar boletim." }, { status: 403 });
  }

  const formData = await req.formData();
  const csvFile = formData.get("csv") as File | null;
  const totp = formData.get("totp") as string | null;

  if (!csvFile || !totp) {
    return NextResponse.json({ error: "CSV e código TOTP são obrigatórios." }, { status: 400 });
  }

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!dbUser.totpSecret) {
    return NextResponse.json({ error: "TOTP não configurado para este usuário." }, { status: 400 });
  }

  try {
    await exigirTotpOuFalhar({
      userId: user.id,
      token: totp,
      secret: dbUser.totpSecret,
      acao: "IMPORTAR_BOLETIM_CSV"
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  const texto = await csvFile.text();
  const { data, errors } = Papa.parse<Record<string, string>>(texto, {
    header: true,
    skipEmptyLines: true
  });

  if (errors.length > 0) {
    return NextResponse.json({ error: "CSV inválido.", detalhes: errors }, { status: 400 });
  }

  let importados = 0;
  const falhas: string[] = [];

  for (const linha of data) {
    try {
      const aluno = await prisma.user.findUnique({ where: { matricula: linha.matricula } });
      const materia = await prisma.materia.findFirst({
        where: { codigo: linha.codigoMateria, serie: parseInt(linha.serie) }
      });

      if (!aluno || !materia) {
        falhas.push(`Linha com matrícula ${linha.matricula}: aluno ou matéria não encontrados.`);
        continue;
      }

      await prisma.boletimOficial.upsert({
        where: {
          userId_materiaId_bimestre: {
            userId: aluno.id,
            materiaId: materia.id,
            bimestre: parseInt(linha.bimestre)
          }
        },
        update: {
          nota: parseFloat(linha.nota),
          faltas: parseInt(linha.faltas),
          totalAulas: parseInt(linha.totalAulas),
          importadoPor: user.id
        },
        create: {
          userId: aluno.id,
          materiaId: materia.id,
          bimestre: parseInt(linha.bimestre),
          nota: parseFloat(linha.nota),
          faltas: parseInt(linha.faltas),
          totalAulas: parseInt(linha.totalAulas),
          importadoPor: user.id
        }
      });

      importados++;
    } catch (e: any) {
      falhas.push(`Erro na linha ${JSON.stringify(linha)}: ${e.message}`);
    }
  }

  return NextResponse.json({ importados, falhas });
}
