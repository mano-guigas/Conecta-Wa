import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin, BUCKET_AVATARS } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo maior que 2MB." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Compressão 400x400 + crop circular feito no client (canvas); aqui garantimos
  // o redimensionamento final para 400x400 no servidor.
  const processado = await sharp(buffer)
    .resize(400, 400, { fit: "cover" })
    .png({ quality: 80 })
    .toBuffer();

  const path = `${user.id}/avatar-${Date.now()}.png`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_AVATARS)
    .upload(path, processado, { contentType: "image/png", upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET_AVATARS).getPublicUrl(path);

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: publicUrlData.publicUrl }
  });

  return NextResponse.json({ avatarUrl: publicUrlData.publicUrl });
}
