"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [totp, setTotp] = useState("");
  const [precisaTotp, setPrecisaTotp] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const res = await signIn("credentials", {
      matricula,
      senha,
      totp,
      redirect: false
    });

    setCarregando(false);

    if (res?.error === "TOTP_REQUIRED") {
      setPrecisaTotp(true);
      setErro("Digite o código TOTP do seu autenticador.");
      return;
    }

    if (res?.error) {
      setErro(res.error);
      return;
    }

    router.push("/aluno");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-slate-100 p-6">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-sm rounded-[28px] p-8 flex flex-col gap-4"
      >
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-ink">Waldemar 72 anos</h1>
          <p className="text-sm text-slate-500">Sistema de Gestão Acadêmica</p>
        </div>

        <input
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          placeholder="Matrícula (ex: 0001-WALDEMAR)"
          className="rounded-[28px] px-4 py-3 bg-white/80 outline-none border border-slate-200 focus:border-blue"
          required
        />
        <input
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password"
          placeholder="Senha"
          className="rounded-[28px] px-4 py-3 bg-white/80 outline-none border border-slate-200 focus:border-blue"
          required
        />

        {precisaTotp && (
          <input
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            placeholder="Código TOTP (6 dígitos)"
            maxLength={6}
            className="rounded-[28px] px-4 py-3 bg-white/80 outline-none border border-slate-200 focus:border-blue tracking-widest text-center"
          />
        )}

        {erro && <p className="text-sm text-red-500">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="rounded-[28px] px-4 py-3 bg-blue text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </motion.form>
    </div>
  );
}
