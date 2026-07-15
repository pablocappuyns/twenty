import {
  pseudonymizePii,
  rehydratePii,
} from 'src/modules/kernel-legal/utils/pseudonymize-pii.util';

describe('pseudonymizePii', () => {
  it('should replace an email with a stable token', () => {
    const { text, mapping } = pseudonymizePii(
      'Contacto: maria.lopez@gmail.com',
    );

    expect(text).toBe('Contacto: [EMAIL_1]');
    expect(mapping['[EMAIL_1]']).toBe('maria.lopez@gmail.com');
  });

  it('should replace a DNI and a NIE', () => {
    const { text } = pseudonymizePii('DNI 12345678Z y NIE X1234567L');

    expect(text).toBe('DNI [DNI_1] y NIE [NIE_1]');
  });

  it('should replace a Spanish IBAN before treating it as digits', () => {
    const { text, mapping } = pseudonymizePii('IBAN ES9121000418450200051332');

    expect(text).toBe('IBAN [IBAN_1]');
    expect(mapping['[IBAN_1]']).toBe('ES9121000418450200051332');
  });

  it('should replace a phone number with and without prefix', () => {
    const { text } = pseudonymizePii('Tel +34 612 345 678 o 698765432');

    expect(text).toBe('Tel [PHONE_1] o [PHONE_2]');
  });

  it('should reuse the same token for a repeated value', () => {
    const { text, mapping } = pseudonymizePii(
      'a@b.com escribe a a@b.com otra vez',
    );

    expect(text).toBe('[EMAIL_1] escribe a [EMAIL_1] otra vez');
    expect(Object.keys(mapping)).toHaveLength(1);
  });

  it('should round-trip through rehydratePii', () => {
    const original = 'Cliente 12345678Z, mail j@k.es, tel 611223344';
    const { text, mapping } = pseudonymizePii(original);

    expect(text).not.toContain('12345678Z');
    expect(rehydratePii(text, mapping)).toBe(original);
  });

  it('should leave text without PII untouched', () => {
    const { text, mapping } = pseudonymizePii('Consulta sobre despido');

    expect(text).toBe('Consulta sobre despido');
    expect(Object.keys(mapping)).toHaveLength(0);
  });
});
