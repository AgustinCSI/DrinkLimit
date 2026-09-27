import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tab3Page } from './tab3.page';

describe('Tab3Page', () => {
  let component: Tab3Page;
  let fixture: ComponentFixture<Tab3Page>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Tab3Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('cancelar descarta los cambios y guardar actualiza el perfil', () => {
    const original = component.perfil();
    component.editar();
    component.borrador.first_name = 'Ana';
    component.fotoBorrador.set('imagen temporal');
    component.cancelar();
    expect(component.perfil()).toBe(original);
    expect(component.fotoVisible()).toBeNull();
    component.editar();
    component.borrador.first_name = 'Ana';
    component.borrador.gender = 'F';
    component.guardar();
    expect(component.perfil().first_name).toBe('Ana');
    expect(component.perfil().gender).toBe('F');
    expect(component.editando()).toBe(false);
  });

  it('mantiene la edición y muestra un error si el nombre solo contiene espacios', () => {
    component.editar();
    component.borrador.first_name = '   ';
    component.guardar();
    expect(component.editando()).toBe(true);
    expect(component.error()).toContain('Completa');
  });

  it('calcula la edad antes y después del cumpleaños usando la fecha local', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 4, 13));
    component.ionViewWillEnter();
    expect(component.edad()).toBe(20);
    vi.setSystemTime(new Date(2026, 4, 14));
    component.ionViewWillEnter();
    expect(component.edad()).toBe(21);
  });

  function elegirArchivo(archivo: File) {
    const campo = document.createElement('input');
    campo.type = 'file';
    Object.defineProperty(campo, 'files', { value: [archivo] });
    component.seleccionarFoto({ target: campo } as unknown as Event);
  }

  it('lee una foto como vista previa y solo la conserva al guardar', async () => {
    component.editar();
    elegirArchivo(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    await vi.waitFor(() => expect(component.leyendoFoto()).toBe(false));
    expect(component.fotoVisible()).toMatch(/^data:image\/png;base64,/);
    expect(component.perfil().foto).toBeNull();
    component.guardar();
    expect(component.perfil().foto).toBe(component.fotoVisible());
  });

  it('rechaza archivos incompatibles y fotos que exceden el tamaño permitido', () => {
    component.editar();
    elegirArchivo(new File(['texto'], 'archivo.txt', { type: 'text/plain' }));
    expect(component.error()).toContain('JPG, PNG o WebP');
    elegirArchivo(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.png', { type: 'image/png' }));
    expect(component.error()).toContain('5 MB');
    expect(component.fotoVisible()).toBeNull();
  });
});
