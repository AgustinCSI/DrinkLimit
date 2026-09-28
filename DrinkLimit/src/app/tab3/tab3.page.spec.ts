import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Tab3Page } from './tab3.page';
import { HistorialLocalService } from '../services/historial-local.service';
import { AuthService } from '../services/auth.service';
import { AppUser, UsersService } from '../services/users.service';
import { FotosService } from '../services/fotos.service';

// Las respuestas se simulan: las pruebas no escriben en Supabase.
describe('Tab3Page con perfil de Supabase', () => {
  let component: Tab3Page;
  let fixture: ComponentFixture<Tab3Page>;
  const usuario = vi.fn();
  const obtener = vi.fn();
  const guardarPerfil = vi.fn();
  const cargar = vi.fn();
  const salir = vi.fn();
  const navigateByUrl = vi.fn();
  const perfil: AppUser = {
    id: 'usuario-prueba', first_name: 'Ana', last_name: 'Pérez', birth_date: '2005-05-14',
    gender: 'F', username: 'ana', weight: 60, avatar_url: 'https://example.com/avatar.png',
  };

  beforeEach(async () => {
    usuario.mockReset().mockResolvedValue({ id: perfil.id });
    obtener.mockReset().mockResolvedValue({ ...perfil });
    guardarPerfil.mockReset().mockResolvedValue(undefined);
    cargar.mockReset().mockResolvedValue('https://example.com/nueva.png');
    salir.mockReset().mockResolvedValue(undefined);
    navigateByUrl.mockReset().mockResolvedValue(true);
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:foto-temporal') });
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { usuario, salir } },
      { provide: UsersService, useValue: { obtener, guardarPerfil } },
      { provide: FotosService, useValue: { cargar } },
      { provide: Router, useValue: { navigateByUrl } },
    ] });
    fixture = TestBed.createComponent(Tab3Page);
    component = fixture.componentInstance;
    await component.ionViewWillEnter();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('carga el perfil autenticado y muestra una sola tarjeta de estadísticas', () => {
    expect(obtener).toHaveBeenCalledWith(perfil.id);
    expect(component.perfil()).toEqual(perfil);
    expect(component.fotoVisible()).toBe(perfil.avatar_url);
    expect(fixture.nativeElement.querySelectorAll('.estadisticas').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
  });

  it('cancelar descarta el borrador sin escribir ni subir fotos', () => {
    component.editar();
    component.borrador.first_name = 'Cambio';
    elegirArchivo(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    component.cancelar();
    expect(component.perfil()).toEqual(perfil);
    expect(component.fotoVisible()).toBe(perfil.avatar_url);
    expect(component.archivoPendiente()).toBeNull();
    expect(guardarPerfil).not.toHaveBeenCalled();
    expect(cargar).not.toHaveBeenCalled();
  });

  it('guarda mediante UsersService conservando nacimiento, username y peso', async () => {
    component.editar();
    component.borrador.first_name = ' Andrea ';
    component.borrador.gender = 'Otro';
    await component.guardar();
    expect(guardarPerfil).toHaveBeenCalledWith(perfil.id, {
      first_name: 'Andrea', last_name: 'Pérez', gender: 'Otro', birth_date: perfil.birth_date,
      username: perfil.username, weight: perfil.weight, avatar_url: perfil.avatar_url,
    });
    expect(component.perfil()?.first_name).toBe('Andrea');
    expect(component.editando()).toBe(false);
  });

  it('el recuerdo usa avatar_url guardado y actualiza sus indicadores al reabrir', () => {
    component.abrirRecuerdo();
    expect(component.recuerdoAbierto()).toBe(true);
    expect(component.datosRecuerdo.foto).toBe(perfil.avatar_url);
    expect(component.datosRecuerdo.topeTragos).toBeNull();
    TestBed.inject(HistorialLocalService).guardar({
      inicio: '2026-09-27T18:00:00Z', fin: '2026-09-27T18:10:00Z',
      ventanas: 1, motivoCierre: 'embriaguez', consumos: [],
    });
    expect(component.datosRecuerdo.topeTragos).toBeNull();
    component.abrirRecuerdo();
    expect(component.datosRecuerdo.topeTragos).toBe(0);
    expect(component.datosRecuerdo.vecesCurado).toBe(1);
  });

  it('no abre el recuerdo con un perfil pendiente o una foto sin guardar', () => {
    component.editar();
    component.abrirRecuerdo();
    expect(component.recuerdoAbierto()).toBe(false);
    component.cancelar();
    component.perfil.set(null);
    component.abrirRecuerdo();
    expect(component.recuerdoAbierto()).toBe(false);
  });

  it('sube la foto antes de persistir su URL y la usa en el recuerdo', async () => {
    component.editar();
    const archivo = new File(['imagen'], 'foto.png', { type: 'image/png' });
    elegirArchivo(archivo);
    expect(component.fotoVisible()).toBe('blob:foto-temporal');
    expect(cargar).not.toHaveBeenCalled();
    await component.guardar();
    expect(cargar).toHaveBeenCalledWith(archivo);
    expect(guardarPerfil).toHaveBeenCalledWith(perfil.id, expect.objectContaining({ avatar_url: 'https://example.com/nueva.png' }));
    expect(cargar.mock.invocationCallOrder[0]).toBeLessThan(guardarPerfil.mock.invocationCallOrder[0]!);
    component.abrirRecuerdo();
    expect(component.datosRecuerdo.foto).toBe('https://example.com/nueva.png');
  });

  it('si falla Storage conserva el perfil y no escribe una URL nueva', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    component.editar();
    elegirArchivo(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    cargar.mockRejectedValue(new Error('Fallo Storage'));
    await component.guardar();
    expect(guardarPerfil).not.toHaveBeenCalled();
    expect(component.perfil()).toEqual(perfil);
    expect(component.editando()).toBe(true);
    expect(component.guardando()).toBe(false);
    expect(component.error()).toContain('No se pudo actualizar');
  });

  it('mantiene la edición y no escribe un nombre compuesto solo por espacios', async () => {
    component.editar();
    component.borrador.first_name = '   ';
    await component.guardar();
    expect(component.editando()).toBe(true);
    expect(component.error()).toContain('Completa');
    expect(guardarPerfil).not.toHaveBeenCalled();
  });

  it('calcula la edad antes y después del cumpleaños con el nacimiento de Supabase', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 4, 13));
    await component.ionViewWillEnter();
    expect(component.edad()).toBe(20);
    vi.setSystemTime(new Date(2026, 4, 14));
    await component.ionViewWillEnter();
    expect(component.edad()).toBe(21);
  });

  it('rechaza archivos incompatibles y fotos mayores de 5 MB', () => {
    component.editar();
    elegirArchivo(new File(['texto'], 'archivo.txt', { type: 'text/plain' }));
    expect(component.error()).toContain('JPG, PNG o WebP');
    elegirArchivo(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.png', { type: 'image/png' }));
    expect(component.error()).toContain('5 MB');
    expect(component.archivoPendiente()).toBeNull();
  });

  it('conserva el cierre de sesión y la navegación aportados por el backend', async () => {
    await component.cerrarSesion();
    expect(salir).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });

  function elegirArchivo(archivo: File) {
    const campo = document.createElement('input');
    campo.type = 'file';
    Object.defineProperty(campo, 'files', { value: [archivo] });
    component.seleccionarFoto({ target: campo } as unknown as Event);
  }
});
