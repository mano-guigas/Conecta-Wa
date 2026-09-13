import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ROTAS_POR_CARGO: Record<string, string[]> = {
  "/aluno": ["ALUNO", "PROFESSOR", "GESTAO", "FUNDADOR"],
  "/boletim": ["ALUNO", "PROFESSOR", "GESTAO", "FUNDADOR"],
  "/professor": ["PROFESSOR", "GESTAO", "FUNDADOR"],
  "/gestao": ["GESTAO", "FUNDADOR"],
  "/fundador": ["FUNDADOR"],
  "/perfil": ["ALUNO", "PROFESSOR", "GESTAO", "FUNDADOR"]
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const cargo = (req.nextauth.token as any)?.cargo as string | undefined;

    const rotaBase = Object.keys(ROTAS_POR_CARGO).find((r) => pathname.startsWith(r));
    if (rotaBase && cargo && !ROTAS_POR_CARGO[rotaBase].includes(cargo)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: { signIn: "/login" }
  }
);

export const config = {
  matcher: ["/aluno/:path*", "/boletim/:path*", "/professor/:path*", "/gestao/:path*", "/fundador/:path*", "/perfil/:path*"]
};
