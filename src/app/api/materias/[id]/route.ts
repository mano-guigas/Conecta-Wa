import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  permiteExtra: z.boolean().optional(),
  capPontoExtra: z.number().min(0.5).max(1.5).optional()
});

// Professor só pode alterar as próprias matérias. GESTAO/FUNDADOR podem
// alterar qualquer uma (útil para correções administrativas).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const materia = await prisma.materia.findUnique({ where: { id: params.id } });
  if (!materia) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });

  const podeEditar =
    ["GESTAO", "FUNDADOR"].includes(user.cargo) ||
    (user.cargo === "PROFESSOR" && materia.professorId === user.id);

  if (!podeEditar) {
    return NextResponse.json({ error: "Sem permissão para editar esta matéria." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const atualizada = await prisma.materia.update({
    where: { id: params.id },
    data: parsed.data
  });

  return NextResponse.json({ materia: atualizada });
}
