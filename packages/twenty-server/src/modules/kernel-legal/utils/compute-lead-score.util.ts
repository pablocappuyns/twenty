// Scoring 1-10 del lead (spec punto 12). Tres factores ponderados, pesos por
// defecto 40/30/30 (configurables más adelante desde appConfig). Cada factor se
// normaliza a 0-1 según su rango del Documento y se escala a 1-10.
// - urgencia: 1 (baja) .. 4 (alta)
// - perfil:   1 (Legalitas) .. 3 (empresa)
// - importe:  1 (<=3k / no cuantificable) .. 3 (>50k)
export type LeadScoreFactors = {
  urgencia?: number;
  perfil?: number;
  importe?: number;
};

export type LeadScoreWeights = {
  urgencia: number;
  perfil: number;
  importe: number;
};

export const DEFAULT_LEAD_SCORE_WEIGHTS: LeadScoreWeights = {
  urgencia: 0.4,
  perfil: 0.3,
  importe: 0.3,
};

const URGENCIA_RANGE = { min: 1, max: 4 };
const PERFIL_RANGE = { min: 1, max: 3 };
const IMPORTE_RANGE = { min: 1, max: 3 };

const normalize = (
  value: number | undefined,
  range: { min: number; max: number },
): number => {
  const clamped = Math.min(Math.max(value ?? range.min, range.min), range.max);

  return (clamped - range.min) / (range.max - range.min);
};

export const computeLeadScore = (
  factors: LeadScoreFactors,
  weights: LeadScoreWeights = DEFAULT_LEAD_SCORE_WEIGHTS,
): number => {
  const weighted =
    weights.urgencia * normalize(factors.urgencia, URGENCIA_RANGE) +
    weights.perfil * normalize(factors.perfil, PERFIL_RANGE) +
    weights.importe * normalize(factors.importe, IMPORTE_RANGE);

  const totalWeight = weights.urgencia + weights.perfil + weights.importe;
  const ratio = totalWeight > 0 ? weighted / totalWeight : 0;

  return Math.min(Math.max(Math.round(1 + ratio * 9), 1), 10);
};
