import { computeLeadScore } from 'src/modules/kernel-legal/utils/compute-lead-score.util';

describe('computeLeadScore', () => {
  it('should return 1 when every factor is at its minimum', () => {
    expect(computeLeadScore({ urgencia: 1, perfil: 1, importe: 1 })).toBe(1);
  });

  it('should return 10 when every factor is at its maximum', () => {
    expect(computeLeadScore({ urgencia: 4, perfil: 3, importe: 3 })).toBe(10);
  });

  it('should weight urgencia at 40%', () => {
    // Solo urgencia al máximo: 0.4 -> round(1 + 0.4*9) = round(4.6) = 5
    expect(computeLeadScore({ urgencia: 4, perfil: 1, importe: 1 })).toBe(5);
  });

  it('should treat a high-value company case as a top score', () => {
    expect(computeLeadScore({ urgencia: 4, perfil: 3, importe: 3 })).toBe(10);
  });

  it('should default missing factors to their minimum', () => {
    expect(computeLeadScore({ urgencia: 4 })).toBe(5);
    expect(computeLeadScore({})).toBe(1);
  });

  it('should clamp out-of-range factor values', () => {
    expect(computeLeadScore({ urgencia: 99, perfil: 99, importe: 99 })).toBe(10);
    expect(computeLeadScore({ urgencia: -5, perfil: -5, importe: -5 })).toBe(1);
  });

  it('should honour custom weights', () => {
    // Todo el peso en importe: importe medio (2) -> 0.5 -> round(1 + 0.5*9) = 6
    expect(
      computeLeadScore(
        { urgencia: 1, perfil: 1, importe: 2 },
        { urgencia: 0, perfil: 0, importe: 1 },
      ),
    ).toBe(6);
  });
});
