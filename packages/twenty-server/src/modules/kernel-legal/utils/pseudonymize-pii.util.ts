// Seudonimización de PII antes de cualquier llamada a Claude (guarda dura RGPD,
// spec punto 17). Reemplaza identificadores estructurados por tokens estables y
// devuelve el mapa para rehidratar la respuesta. Los nombres propios requieren
// NER y se tratan en la capa de IA; aquí se cubren los identificadores exactos.
export type PseudonymizationResult = {
  text: string;
  mapping: Record<string, string>;
};

type PiiPattern = {
  label: string;
  regex: RegExp;
};

// El orden importa: los patrones más específicos (que contienen dígitos) van
// antes para que un IBAN/NIE no se fragmente como teléfono o DNI.
const PII_PATTERNS: PiiPattern[] = [
  {
    label: 'EMAIL',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  { label: 'IBAN', regex: /\bES\d{22}\b/gi },
  { label: 'NIE', regex: /\b[XYZ]\d{7}[A-Za-z]\b/gi },
  { label: 'DNI', regex: /\b\d{8}[A-Za-z]\b/g },
  {
    label: 'PHONE',
    regex: /(?:\+34[\s-]?)?[6-9](?:[\s-]?\d){8}\b/g,
  },
];

export const pseudonymizePii = (input: string): PseudonymizationResult => {
  const mapping: Record<string, string> = {};
  const tokenByValue = new Map<string, string>();
  const counters: Record<string, number> = {};

  let text = input;

  for (const { label, regex } of PII_PATTERNS) {
    text = text.replace(regex, (match) => {
      const existingToken = tokenByValue.get(match);

      if (existingToken !== undefined) {
        return existingToken;
      }

      counters[label] = (counters[label] ?? 0) + 1;
      const token = `[${label}_${counters[label]}]`;

      tokenByValue.set(match, token);
      mapping[token] = match;

      return token;
    });
  }

  return { text, mapping };
};

// Rehidrata la respuesta de la IA sustituyendo los tokens por sus valores.
export const rehydratePii = (
  text: string,
  mapping: Record<string, string>,
): string => {
  return Object.entries(mapping).reduce(
    (result, [token, original]) => result.split(token).join(original),
    text,
  );
};
