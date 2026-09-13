# Waldemar OS — SGA (Sistema de Gestão Acadêmica)

Plataforma da Escola Waldemar (72 anos, Ceará), construída por Guilherme (mano-guigas).

Stack: Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion + Supabase
(Auth/Postgres/Storage) + Prisma + NextAuth + PWA.

## 1. Pré-requisitos

- Node.js 18+
- Conta gratuita no [Supabase](https://supabase.com)
- Conta gratuita na [Vercel](https://vercel.com)
- Chave de API gratuita da [Groq](https://console.groq.com) (para a IA Tutor Waldemar)

## 2. Configurar o Supabase

1. Crie um novo projeto no Supabase.
2. Em **Project Settings → Database**, copie a *Connection string* (modo `URI`) e
   use como `DATABASE_URL` no `.env`.
3. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

### Criar os buckets de Storage

No painel do Supabase, vá em **Storage** e crie dois buckets:

- `avatars` — público (para fotos de perfil, 400x400, máx 2MB)
- `boletins` — privado (para anexos/planilhas de boletim, se necessário)

Para o bucket `avatars`, marque a opção **Public bucket** para que as fotos
sejam exibidas diretamente via URL pública.

## 3. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha todos os valores:

```bash
cp .env.example .env
```

Gere o `NEXTAUTH_SECRET` com:

```bash
openssl rand -base64 32
```

## 4. Instalar dependências e preparar o banco

```bash
npm install
npx prisma migrate dev --name init
npm run seed
```

O seed cria:
- O usuário **FUNDADOR** com matrícula `0001-WALDEMAR`, senha padrão
  `waldemar72#root` (troca obrigatória no 1º login).
- As **14 matérias fixas** (Português, Matemática, História, Geografia,
  Inglês, Arte, Ed. Física, Filosofia, Sociologia, Espanhol, Redação,
  Química, Física, Biologia) para as **3 séries**.
- O `CAP_GLOBAL` padrão de `1.0` ponto extra.

## 5. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000` e entre com a matrícula `0001-WALDEMAR` e a
senha padrão.

## 6. Configurar TOTP (2FA) para o Fundador

Aprovações de missões extras, importação de CSV e o encerramento do ano
letivo exigem um código TOTP de 6 dígitos. Para gerar o QR Code inicial do
fundador, use a função `gerarQrCodeTotp` em `src/lib/totp.ts` numa rota
administrativa própria, ou gere manualmente com qualquer app TOTP
(Google Authenticator, Authy) a partir de um segredo criado com
`gerarSegredoTotp()`, salvando o segredo no campo `totpSecret` do usuário.

## 7. Deploy na Vercel (plano Hobby, grátis)

1. Suba este repositório para o GitHub.
2. Na Vercel, clique em **New Project** e importe o repositório.
3. Em **Environment Variables**, adicione todas as variáveis do `.env`.
4. O build já roda `prisma generate` automaticamente via `postinstall`.
5. Depois do primeiro deploy, rode as migrations apontando para o banco de
   produção:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

## 8. Regras de negócio implementadas

1. **Cap de ponto extra** (`src/lib/cap.ts`): soma missões `APROVADO` no
   bimestre; bloqueia com "Cap de X atingido" se ultrapassar o cap da
   matéria ou o `CAP_GLOBAL`.
2. **Frequência** (`src/lib/frequencia.ts`): `100 - (faltas/total*100)`;
   `riscoReprovacaoFalta = true` se `< 75%`.
3. **Fundador root**: matrícula `0001-WALDEMAR`, único que importa CSV e
   vê os `LogSeguranca`.
4. **TOTP obrigatório** em toda aprovação de missão, importação de CSV e
   encerramento de ano — cada tentativa (válida ou não) é registrada em
   `LogSeguranca`.
5. **Encerramento do Ano Letivo** (`/fundador`, `src/app/api/encerrar-ano`):
   3º ano → arquivado em `HistoricoFinal` (`ativo=false`, sai da turma);
   1º/2º ano → promovidos automaticamente (`serie++`), `ProgressoMateria`
   resetado, `BoletimOficial` sempre preservado.
6. **Barra de Progresso Fluida** (`src/components/ProgressoFluido.tsx`):
   animação Framer Motion 0% → real em 1500ms `easeOut`, três etapas
   (atividades 40% + parcial 30% + bimestral 30%).

## 9. IA Tutor Waldemar

Rota `src/app/api/ai/tutor/route.ts`, usando Groq (`llama-3.3-70b-versatile`)
com streaming SSE. As chaves `BRAVE_API_KEY` e `GEMINI_API_KEY` estão
reservadas no `.env.example` para uso futuro, mas a IA funciona apenas com
`GROQ_API_KEY`.

## 10. Estrutura de pastas

```
waldemar-os/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── icons/ (icon-192.png, icon-512.png)
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── aluno/
│   │   ├── boletim/
│   │   ├── professor/
│   │   ├── gestao/
│   │   ├── fundador/
│   │   ├── perfil/
│   │   └── api/
│   ├── components/
│   ├── lib/
│   └── middleware.ts
├── package.json
├── next.config.js
├── tailwind.config.ts
└── .env.example
```
