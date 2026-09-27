import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tab1Page } from './tab1.page';

describe('Tab1Page', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it.each([
    ['1', '01:10:00'], ['2', '02:20:00'], ['3', '03:30:00'],
    ['4', '04:40:00'], ['5', '05:50:00'], ['6', '07:00:00'],
  ])('calcula la duración de %s ventanas', (cantidad, duracion) => {
    component.abrirSelector();
    component.confirmarVentanas(cantidad);
    expect(component.duracionSeleccionada()).toBe(duracion);
    expect(component.selectorAbierto()).toBe(false);
  });

  it('cancelar no inicia una sesión ni crea un temporizador', () => {
    component.abrirSelector();
    component.cerrarSelector();
    expect(component.ventanasSeleccionadas()).toBeNull();
    expect(component.sesionActiva()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rechaza cantidades fuera de las seis opciones', () => {
    for (const valor of ['0', '7', '2.5', 'Corona']) {
      component.confirmarVentanas(valor);
      expect(component.ventanasSeleccionadas()).toBeNull();
    }
  });

  it('cuenta hacia atrás desde la duración confirmada', () => {
    component.confirmarVentanas('1');
    expect(component.tiempoRestante()).toBe('01:10:00');
    vi.advanceTimersByTime(1000);
    expect(component.tiempoRestante()).toBe('01:09:59');
    expect(component.sesionActiva()).toBe(true);
  });

  it('no permite reiniciar ni duplicar un temporizador activo', () => {
    component.confirmarVentanas('1');
    vi.advanceTimersByTime(1000);
    component.abrirSelector();
    component.confirmarVentanas('6');
    expect(component.selectorAbierto()).toBe(false);
    expect(component.ventanasSeleccionadas()).toBe(1);
    expect(component.tiempoRestante()).toBe('01:09:59');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('recupera el tiempo transcurrido al volver a Inicio sin esperar cada tick', () => {
    component.confirmarVentanas('1');
    vi.setSystemTime(Date.now() + 10 * 60 * 1000);
    component.ionViewWillEnter();
    expect(component.tiempoRestante()).toBe('01:00:00');
  });

  it('finaliza a cero, limpia el intervalo y permite una nueva sesión', () => {
    component.confirmarVentanas('1');
    vi.setSystemTime(Date.now() + 71 * 60 * 1000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(component.tiempoRestante()).toBe('00:00:00');
    expect(component.sesionActiva()).toBe(false);
    expect(component.tiempoAgotado()).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    component.confirmarVentanas('2');
    expect(component.tiempoRestante()).toBe('02:20:00');
    expect(component.tiempoAgotado()).toBe(false);
    expect(component.sesionActiva()).toBe(true);
  });

  it('libera el intervalo al destruir la página', () => {
    component.confirmarVentanas('1');
    component.ngOnDestroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
