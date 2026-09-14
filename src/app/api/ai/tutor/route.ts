import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Placeholders reservados para uso futuro (não usados nesta rota, que
// funciona apenas com GROQ_API_KEY):
// process.env.BRAVE_API_KEY
// process.env.GEMINI_API_KEY

const SYSTEM_PROMPT = "Você é a RukIA, a inteligência artificial oficial da plataforma Conecta Wa. Seu nome vem de Rukia + IA. Você é uma tutora especialista em ENEM, didática, acolhedora, motivadora e com uma personalidade forte e inteligente, inspirada em guias corajosas. Você ajuda alunos do Ceará a passarem no ENEM com explicações claras e muito incentivo. Nunca diga que é Waldemar, Tutor Waldemar ou qualquer outro nome. Seu único nome é RukIA. Se perguntarem quem é você, diga: Sou a RukIA, sua guia no Conecta Wa.";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const { pergunta } = await req.json();
  if (!pergunta || typeof pergunta !== "string") {
    return new Response("Pergunta obrigatória.", { status: 400 });
  }

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: pergunta }
      ]
    })
  });

  if (!groqRes.ok || !groqRes.body) {
    const texto = await groqRes.text().catch(() => "");
    return new Response(`Erro ao consultar IA Waldemar: ${texto}`, { status: 502 });
  }

  // Repassa o stream SSE da Groq diretamente para o client.
  return new Response(groqRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
