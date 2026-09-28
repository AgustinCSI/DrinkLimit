import { TestBed } from '@angular/core/testing';
import { HistorialService } from './historial.service';
import { SessionsService } from './drinking-sessions.service';
import { AuthService } from './auth.service';

describe('HistorialService', () => {
  const historial = vi.fn();
  const tragosDeSesion = vi.fn();
  beforeEach(() => {
    historial.mockReset().mockResolvedValue([]);
    tragosDeSesion.mockReset().mockResolvedValue([]);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { usuario: vi.fn().mockResolvedValue({ id: 'u1' }) } },
      { provide: SessionsService, useValue: { historial, tragosDeSesion } },
    ] });
  });

  it('distingue máximos generales y por embriaguez', async () => {
    historial.mockResolvedValue([
      { id: 's1', end_reason: 'tiempo' }, { id: 's2', end_reason: 'embriaguez' },
    ]);
    tragosDeSesion.mockImplementation(async (id) => Array.from({ length: id === 's1' ? 12 : 10 }, () => ({ drinks: { brand: 'Corona' } })));
    const servicio = TestBed.inject(HistorialService);
    await servicio.cargar();
    expect(servicio.vecesCurado()).toBe(1);
    expect(servicio.topeTragos()).toBe(12);
    expect(servicio.limitePersonal()).toBe(10);
  });

  it('elige el evento tope, conserva el más reciente en empate y no sustituye su foto ausente', async () => {
    historial.mockResolvedValue([
      { id: 'reciente', photo_url: 'reciente.png' },
      { id: 'tope', end_reason: 'tiempo', photo_url: 'tope.png' },
      { id: 'empate', photo_url: 'empate.png' },
    ]);
    tragosDeSesion.mockImplementation(async (id) => Array.from({ length: id === 'reciente' ? 1 : 3 }, () => ({ drinks: { brand: 'Corona' } })));
    const servicio = TestBed.inject(HistorialService);
    await servicio.cargar();
    expect(servicio.sesionTope()?.id).toBe('tope');
    expect(servicio.sesionTope()?.fotoUrl).toBe('tope.png');
    historial.mockResolvedValue([{ id: 'tope' }, { id: 'reciente', photo_url: 'reciente.png' }]);
    await servicio.cargar();
    expect(servicio.sesionTope()?.fotoUrl).toBeNull();
  });

  it('conserva cero y no inventa embriaguez cuando faltan motivos históricos', async () => {
    const servicio = TestBed.inject(HistorialService);
    await servicio.cargar();
    expect(servicio.vecesCurado()).toBe(0);
    expect(servicio.topeTragos()).toBeNull();
    historial.mockResolvedValue([{ id: 's1', end_reason: 'embriaguez' }]);
    await servicio.cargar();
    expect(servicio.topeTragos()).toBe(0);
    expect(servicio.limitePersonal()).toBe(0);
    historial.mockResolvedValue([{ id: 's1', end_reason: null }]);
    await servicio.cargar();
    expect(servicio.topeTragos()).toBe(0);
    expect(servicio.vecesCurado()).toBeNull();
    expect(servicio.limitePersonal()).toBeNull();
  });

  it('limpia datos anteriores si falla una carga y descarta respuestas atrasadas', async () => {
    const servicio = TestBed.inject(HistorialService);
    let resolver!: (datos: unknown[]) => void;
    historial.mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve; }));
    const primera = servicio.cargar();
    await Promise.resolve();
    await servicio.cargar();
    resolver([{ id: 'otro-usuario' }]);
    await primera;
    expect(servicio.sesiones()).toEqual([]);
    historial.mockRejectedValue(new Error('Red'));
    await servicio.cargar();
    expect(servicio.error()).not.toBe('');
    expect(servicio.vecesCurado()).toBeNull();
  });
});
