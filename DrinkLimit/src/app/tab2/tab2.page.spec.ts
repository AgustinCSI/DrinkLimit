import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tab2Page } from './tab2.page';
import { Tab1Page } from '../tab1/tab1.page';

describe('Tab2Page', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra un estado vacío antes de finalizar sesiones', () => {
    const elemento: HTMLElement = fixture.nativeElement;
    expect(elemento.textContent).toContain('Aún no tienes sesiones registradas');
    expect(elemento.querySelectorAll('ion-card').length).toBe(0);
  });

  it('recibe el cierre desde Inicio y actualiza el historial ya abierto', () => {
    const inicioFixture = TestBed.createComponent(Tab1Page);
    const inicio = inicioFixture.componentInstance;
    try {
      inicio.confirmarVentanas('1');
      inicio.abrirSelectorCerveza();
      inicio.confirmarCerveza('Corona');
      inicio.detenerPorEmbriaguez();
      fixture.detectChanges();

      const elemento: HTMLElement = fixture.nativeElement;
      expect(elemento.querySelectorAll('ion-card').length).toBe(1);
      expect(elemento.textContent).toContain('Cervezas: 1');
      expect(elemento.textContent).toContain('Embriaguez declarada');
      expect(elemento.textContent).not.toContain('Aún no tienes sesiones registradas');
    } finally {
      inicioFixture.destroy();
    }
  });
});
