import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verificarTotp } from "./totp";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Waldemar",
      credentials: {
        matricula: { label: "Matrícula", type: "text" },
        senha: { label: "Senha", type: "password" },
        totp: { label: "Código TOTP", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.matricula || !credentials?.senha) {
          throw new Error("Matrícula e senha são obrigatórios.");
        }

        const user = await prisma.user.findUnique({
          where: { matricula: credentials.matricula }
        });

        if (!user || !user.ativo) {
          throw new Error("Usuário não encontrado ou inativo.");
        }

        const senhaOk = await bcrypt.compare(credentials.senha, user.senhaHash);
        if (!senhaOk) {
          throw new Error("Senha incorreta.");
        }

        // TOTP só é exigido se o usuário já tiver configurado (staff/fundador
        // sempre exigem; aluno comum pode não ter 2FA ativado).
        if (user.totpSecret) {
          if (!credentials.totp) {
            throw new Error("TOTP_REQUIRED");
          }
          const totpOk = verificarTotp(credentials.totp, user.totpSecret);
          if (!totpOk) {
            throw new Error("Código TOTP inválido.");
          }
        }

        await prisma.logSeguranca.create({
          data: { acao: "LOGIN", userId: user.id }
        });

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          matricula: user.matricula,
          cargo: user.cargo,
          serie: user.serie,
          precisaTrocarSenha: user.precisaTrocarSenha
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.matricula = u.matricula;
        token.cargo = u.cargo;
        token.serie = u.serie;
        token.precisaTrocarSenha = u.precisaTrocarSenha;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).matricula = token.matricula;
        (session.user as any).cargo = token.cargo;
        (session.user as any).serie = token.serie;
        (session.user as any).precisaTrocarSenha = token.precisaTrocarSenha;
        (session.user as any).id = token.sub;
      }
      return session;
    }
  }
};
