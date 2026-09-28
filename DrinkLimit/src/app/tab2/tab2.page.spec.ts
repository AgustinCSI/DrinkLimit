import { TestBed } from '@angular/core/testing';
import { Tab2Page } from './tab2.page';
import { AuthService } from '../services/auth.service';
import { SessionsService } from '../services/drinking-sessions.service';

describe('Historial remoto', () => {
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

  it('consulta las sesiones del usuario y muestra vacío solo después de cargar', async () => {
    const fixture = TestBed.createComponent(Tab2Page);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Aún no tienes sesiones');
    await fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();
    expect(historial).toHaveBeenCalledWith('u1');
    expect(fixture.nativeElement.textContent).toContain('Aún no tienes sesiones');
  });

  it('muestra consumos reales y no inventa el cierre de una sesión antigua', async () => {
    historial.mockResolvedValue([{ id: 's1', start_time: '2026-09-28T15:00:00Z', end_time: '2026-09-28T16:00:00Z' }]);
    tragosDeSesion.mockResolvedValue([{ drunk_on: '2026-09-28T15:01:00Z', drinks: { brand: 'Corona' } }]);
    const fixture = TestBed.createComponent(Tab2Page);
    await fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();
    expect(tragosDeSesion).toHaveBeenCalledWith('s1');
    expect(fixture.nativeElement.textContent).toContain('Cervezas: 1');
    expect(fixture.nativeElement.textContent).toContain('Motivo no registrado');
  });

  it('muestra error en lugar de confundir una consulta fallida con un historial vacío', async () => {
    historial.mockRejectedValue(new Error('Sin conexión'));
    const fixture = TestBed.createComponent(Tab2Page);
    await fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el historial');
    expect(fixture.nativeElement.textContent).not.toContain('Aún no tienes sesiones');
  });
});
