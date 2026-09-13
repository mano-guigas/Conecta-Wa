/**
 * Regra inquebrável #2:
 * Frequência = 100 - (faltas / totalAulas * 100)
 * Se frequência < 75%, riscoReprovacaoFalta = true (barra vermelha na UI).
 */
export function calcularFrequencia(faltas: number, totalAulas: number) {
  if (totalAulas <= 0) {
    return { frequencia: 100, riscoReprovacaoFalta: false };
  }
  const frequencia = 100 - (faltas / totalAulas) * 100;
  const arredondada = Math.max(0, Math.min(100, Math.round(frequencia * 10) / 10));
  return {
    frequencia: arredondada,
    riscoReprovacaoFalta: arredondada < 75
  };
}

/**
 * Regra #6: cálculo do percentual de ProgressoMateria
 * Atividades 40% + Parcial 30% + Bimestral 30%
 */
export function calcularPercentualProgresso(params: {
  atividadeFeita: number;
  atividadeTotal: number;
  parcialFeita: boolean;
  bimestralFeita: boolean;
}) {
  const { atividadeFeita, atividadeTotal, parcialFeita, bimestralFeita } = params;

  const pctAtividade = atividadeTotal > 0 ? (atividadeFeita / atividadeTotal) * 40 : 0;
  const pctParcial = parcialFeita ? 30 : 0;
  const pctBimestral = bimestralFeita ? 30 : 0;

  return Math.round(pctAtividade + pctParcial + pctBimestral);
}
