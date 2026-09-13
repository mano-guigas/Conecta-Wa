import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MATERIAS_FIXAS = [
  { nome: "Português", codigo: "POR" },
  { nome: "Matemática", codigo: "MAT" },
  { nome: "História", codigo: "HIS" },
  { nome: "Geografia", codigo: "GEO" },
  { nome: "Inglês", codigo: "ING" },
  { nome: "Arte", codigo: "ART" },
  { nome: "Ed. Física", codigo: "EDF" },
  { nome: "Filosofia", codigo: "FIL" },
  { nome: "Sociologia", codigo: "SOC" },
  { nome: "Espanhol", codigo: "ESP" },
  { nome: "Redação", codigo: "RED" },
  { nome: "Química", codigo: "QUI" },
  { nome: "Física", codigo: "FIS" },
  { nome: "Biologia", codigo: "BIO" }
];

async function main() {
  console.log("Seed iniciado — Escola Waldemar 72 anos");

  // Fundador (regra inquebrável #3): matrícula 0001-WALDEMAR = Guilherme (mano-guigas)
  const senhaPadraoHash = await bcrypt.hash("waldemar72#root", 10);

  const fundador = await prisma.user.upsert({
    where: { matricula: "0001-WALDEMAR" },
    update: {},
    create: {
      nome: "Guilherme (mano-guigas)",
      matricula: "0001-WALDEMAR",
      email: "fundador@waldemar72.edu.br",
      senhaHash: senhaPadraoHash,
      precisaTrocarSenha: true,
      cargo: "FUNDADOR",
      ativo: true
    }
  });

  console.log(`Fundador criado: ${fundador.matricula}`);

  // 14 matérias fixas para cada uma das 3 séries
  for (const serie of [1, 2, 3]) {
    for (const materia of MATERIAS_FIXAS) {
      await prisma.materia.upsert({
        where: { codigo_serie: { codigo: materia.codigo, serie } },
        update: {},
        create: {
          nome: materia.nome,
          codigo: materia.codigo,
          serie,
          capPontoExtra: 1.0,
          permiteExtra: true
        }
      });
    }
  }

  console.log(`${MATERIAS_FIXAS.length} matérias x 3 séries = ${MATERIAS_FIXAS.length * 3} registros criados/verificados.`);

  // Cap global padrão
  await prisma.config.upsert({
    where: { key: "CAP_GLOBAL" },
    update: {},
    create: { key: "CAP_GLOBAL", value: "1.0" }
  });

  console.log("Seed finalizado com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
