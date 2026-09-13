import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfessorPainel from "./painel";

export default async function ProfessorPage() {
  const session = await getServerSession(authOptions);
  const professorId = (session!.user as any).id as string;

  const materias = await prisma.materia.findMany({
    where: { professorId },
    orderBy: { nome: "asc" }
  });

  const missoesPendentes = await prisma.missaoExtra.findMany({
    where: { status: "ENVIADO", materiaId: { in: materias.map((m) => m.id) } },
    include: { aluno: { select: { nome: true, matricula: true } }, materia: true },
    orderBy: { criadoEm: "asc" }
  });

  return (
    <div className="min-h-screen bg-white p-4 lg:p-10">
      <h1 className="text-2xl font-bold text-ink mb-6">Painel do Professor</h1>
      <ProfessorPainel materiasIniciais={materias} missoesIniciais={missoesPendentes as any} />
    </div>
  );
}
