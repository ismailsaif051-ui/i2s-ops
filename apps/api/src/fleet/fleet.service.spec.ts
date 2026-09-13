import { describe, expect, it } from 'vitest';
import {
  VEHICLE_OWNERSHIPS,
  VEHICLE_OWNERSHIP_LABELS,
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  startOfDay,
} from './fleet.service';

describe('flotte', () => {
  it('nomme les modes de détention comme le contrat de location', () => {
    // LLD et LCD sont les termes des contrats marocains : les renommer
    // rendrait les loyers incomparables avec les factures du loueur.
    expect(VEHICLE_OWNERSHIPS).toEqual(['OWNED', 'LLD', 'LCD']);
    for (const o of VEHICLE_OWNERSHIPS) {
      expect(VEHICLE_OWNERSHIP_LABELS[o], `mode ${o} sans libellé`).toBeTruthy();
    }
  });

  it('distingue le véhicule de service du véhicule de fonction', () => {
    // La distinction porte un enjeu fiscal : un véhicule de fonction est un
    // avantage en nature, pas un véhicule de service.
    expect(VEHICLE_TYPES).toEqual(['SERVICE', 'FUNCTION']);
    expect(VEHICLE_TYPE_LABELS.FUNCTION).toContain('fonction');
  });

  it('ramène une date au début du jour, en UTC', () => {
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    expect(iso(startOfDay(new Date('2026-09-09T23:30:00.000Z')))).toBe('2026-09-09');
    expect(iso(startOfDay(new Date('2026-09-09T00:00:00.000Z')))).toBe('2026-09-09');
  });
});
