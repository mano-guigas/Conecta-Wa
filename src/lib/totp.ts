import { authenticator } from "otplib";
// @ts-ignore
import QRCode from "qrcode";
import { prisma } from "./prisma";

/**
 * Regra inquebrável #4:
 * Toda aprovação (missões) e toda importação (CSV boletim) exige um
 * código TOTP de 6 dígitos. Cada verificação, aprovada ou não, é
 * registrada em LogSeguranca.
 */
authenticator.options = { window: 1, step: 30, digits: 6 };

export function gerarSegredoTotp() {
  return authenticator.generateSecret();
}

export async function gerarQrCodeTotp(email: string, secret: string) {
  const otpauth = authenticator.keyuri(email, "Waldemar 72 anos", secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  return { otpauth, qrDataUrl };
}

export function verificarTotp(token: string, secret: string) {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

export async function exigirTotpOuFalhar(params: {
  userId: string;
  token: string;
  secret: string;
  acao: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  const valido = verificarTotp(params.token, params.secret);

  await prisma.logSeguranca.create({
    data: {
      acao: params.acao,
      userId: params.userId,
      metadata: { valido, ...params.metadata } as any,
      ip: params.ip
    }
  });

  if (!valido) {
    throw new Error("Código TOTP inválido.");
  }

  return true;
}
