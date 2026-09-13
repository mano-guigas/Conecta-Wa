import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AvatarUpload from "@/components/AvatarUpload";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return (
    <div className="min-h-screen bg-white p-4 lg:p-10 flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold text-ink">Meu Perfil</h1>
      <AvatarUpload avatarUrlAtual={user.avatarUrl} />
      <div className="glass rounded-[28px] p-6 w-full max-w-md flex flex-col gap-2">
        <p><strong>Nome:</strong> {user.nome}</p>
        <p><strong>Matrícula:</strong> {user.matricula}</p>
        <p><strong>Cargo:</strong> {user.cargo}</p>
        {user.serie && <p><strong>Série:</strong> {user.serie}º ano</p>}
      </div>
    </div>
  );
}
