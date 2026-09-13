import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCapGlobal, setCapGlobal } from "@/lib/cap";
import { exigirTotpOuFalhar } from "@/lib/totp";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  novoCap: z.number().min(0.5).max(1.5),
  totp: z.string().length(6)
});

export async function GET() {
  const cap = await getCapGlobal();
  return NextResponse.json({ cap });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.cargo !== "FUNDADOR") {
    return NextResponse.json({ error: "Apenas o FUNDADOR pode alterar o cap global." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!dbUser.totpSecret) {
    return NextResponse.json({ error: "TOTP não configurado para este usuário." }, { status: 400 });
  }

  try {
    await exigirTotpOuFalhar({
      userId: user.id,
      token: parsed.data.totp,
      secret: dbUser.totpSecret,
      acao: "ALTERAR_CAP_GLOBAL",
      metadata: { novoCap: parsed.data.novoCap },
      ip: req.headers.get("x-forwarded-for") ?? undefined
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  await setCapGlobal(parsed.data.novoCap);
  return NextResponse.json({ ok: true, novoCap: parsed.data.novoCap });
}
