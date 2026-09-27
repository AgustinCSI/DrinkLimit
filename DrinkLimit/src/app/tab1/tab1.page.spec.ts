import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tab1Page } from './tab1.page';
import { HistorialLocalService } from '../services/historial-local.service';

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

  it.each(['Corona', 'Austral', 'Becker', 'Patagonia', 'Cusqueña'])(
    'registra una cerveza %s con fecha solo al confirmar', (marca) => {
      component.confirmarVentanas('1');
      component.abrirSelectorCerveza();
      expect(component.cantidadCervezas()).toBe(0);
      component.confirmarCerveza(marca);
      expect(component.consumos()).toEqual([{ marca, fecha: new Date().toISOString() }]);
      expect(component.cantidadCervezas()).toBe(1);
      expect(component.selectorCervezaAbierto()).toBe(false);
      component.confirmarCerveza(marca);
      expect(component.cantidadCervezas()).toBe(1);
    },
  );

  it('cancelar o confirmar una marca inexistente no suma', () => {
    component.confirmarVentanas('1');
    component.abrirSelectorCerveza();
    component.confirmarCerveza('Otra');
    expect(component.cantidadCervezas()).toBe(0);
    component.cerrarSelectorCerveza();
    expect(component.cantidadCervezas()).toBe(0);
  });

  it('resta el último registro, conserva los anteriores y nunca baja de cero', () => {
    component.confirmarVentanas('1');
    for (const marca of ['Corona', 'Austral']) {
      component.abrirSelectorCerveza();
      component.confirmarCerveza(marca);
    }
    component.restarCerveza();
    expect(component.cantidadCervezas()).toBe(1);
    expect(component.ultimaCerveza()).toBe('Corona');
    component.restarCerveza();
    component.restarCerveza();
    expect(component.cantidadCervezas()).toBe(0);
  });

  it('detener manualmente conserva el consumo y bloquea cambios posteriores', () => {
    component.confirmarVentanas('1');
    component.abrirSelectorCerveza();
    component.confirmarCerveza('Becker');
    vi.advanceTimersByTime(1000);
    component.detenerPorEmbriaguez();
    expect(component.motivoCierre()).toBe('embriaguez');
    expect(component.sesionActiva()).toBe(false);
    expect(component.tiempoRestante()).toBe('01:09:59');
    expect(vi.getTimerCount()).toBe(0);
    component.restarCerveza();
    component.abrirSelectorCerveza();
    component.confirmarCerveza('Corona');
    expect(component.selectorCervezaAbierto()).toBe(false);
    expect(component.cantidadCervezas()).toBe(1);
  });

  it('si vence el tiempo con el selector abierto, no admite una confirmación tardía', () => {
    component.confirmarVentanas('1');
    component.abrirSelectorCerveza();
    vi.setSystemTime(Date.now() + 70 * 60 * 1000);
    component.confirmarCerveza('Corona');
    expect(component.selectorCervezaAbierto()).toBe(false);
    expect(component.cantidadCervezas()).toBe(0);
    expect(component.motivoCierre()).toBe('tiempo');
    component.detenerPorEmbriaguez();
    expect(component.motivoCierre()).toBe('tiempo');
  });

  it('no deja restar después del vencimiento aunque el intervalo todavía no haya corrido', () => {
    component.confirmarVentanas('1');
    component.abrirSelectorCerveza();
    component.confirmarCerveza('Patagonia');
    vi.setSystemTime(Date.now() + 70 * 60 * 1000);
    component.restarCerveza();
    expect(component.cantidadCervezas()).toBe(1);
    expect(component.motivoCierre()).toBe('tiempo');
  });

  it('una nueva sesión comienza sin consumos ni motivo de cierre anterior', () => {
    component.confirmarVentanas('1');
    component.abrirSelectorCerveza();
    component.confirmarCerveza('Cusqueña');
    component.detenerPorEmbriaguez();
    component.confirmarVentanas('2');
    expect(component.cantidadCervezas()).toBe(0);
    expect(component.ultimaCerveza()).toBe('');
    expect(component.motivoCierre()).toBeNull();
    expect(component.tiempoRestante()).toBe('02:20:00');
  });

  it('solo guarda al finalizar y conserva la primera sesión al iniciar otra', () => {
    const historial = TestBed.inject(HistorialLocalService);
    const inicio = new Date().toISOString();
    component.confirmarVentanas('1');
    component.abrirSelectorCerveza();
    component.confirmarCerveza('Corona');
    expect(historial.sesiones()).toHaveLength(0);
    vi.advanceTimersByTime(2000);
    component.detenerPorEmbriaguez();
    component.detenerPorEmbriaguez();
    component.actualizarTiempo();
    expect(historial.sesiones()).toHaveLength(1);
    expect(historial.sesiones()[0]).toMatchObject({
      inicio,
      fin: new Date().toISOString(),
      motivoCierre: 'embriaguez',
      ventanas: 1,
    });
    component.confirmarVentanas('2');
    component.abrirSelectorCerveza();
    component.confirmarCerveza('Austral');
    expect(historial.sesiones()[0]!.consumos[0]!.marca).toBe('Corona');
    expect(historial.sesiones()).toHaveLength(1);
  });

  it('guarda el fin previsto al expirar en segundo plano, incluso con cero consumos', () => {
    const historial = TestBed.inject(HistorialLocalService);
    const inicio = Date.now();
    component.confirmarVentanas('1');
    vi.setSystemTime(inicio + 80 * 60 * 1000);
    component.actualizarTiempo();
    component.ionViewWillEnter();
    expect(historial.sesiones()).toHaveLength(1);
    expect(historial.sesiones()[0]).toMatchObject({
      fin: new Date(inicio + 70 * 60 * 1000).toISOString(),
      motivoCierre: 'tiempo',
      consumos: [],
    });
  });
});
