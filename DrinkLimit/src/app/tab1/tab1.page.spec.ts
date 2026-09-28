import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tab1Page } from './tab1.page';
import { AuthService } from '../services/auth.service';
import { DrinkingSession, SessionDrink, SessionsService, Drink } from '../services/drinking-sessions.service';

describe('Inicio conectado a Supabase', () => {
  let fixture: ComponentFixture<Tab1Page>;
  let page: Tab1Page;
  let sesion: DrinkingSession | null;
  let tragos: (SessionDrink & { drinks: Drink })[];
  const api = {
    listaDrinks: vi.fn(), sesionActiva: vi.fn(), iniciarSesion: vi.fn(), obtenerSesion: vi.fn(),
    definirVentanas: vi.fn(), terminarSesion: vi.fn(), agregarTrago: vi.fn(), quitarTrago: vi.fn(), tragosDeSesion: vi.fn(),
  };
  const crearSesion = (ventanas: number | null = 1): DrinkingSession => ({
    id: 's1', user_id: 'u1', start_time: new Date().toISOString(), end_time: null, window_count: ventanas, end_reason: null,
  });

  beforeEach(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-09-28T15:00:00Z'));
    sesion = null; tragos = [];
    Object.values(api).forEach((metodo) => metodo.mockReset());
    api.listaDrinks.mockResolvedValue([{ id: 'c1', brand: 'Corona' }, { id: 'c2', brand: 'Austral' }]);
    api.sesionActiva.mockImplementation(async () => sesion && !sesion.end_time ? { ...sesion } : undefined);
    api.iniciarSesion.mockImplementation(async (_, ventanas) => { sesion = crearSesion(ventanas); return { ...sesion }; });
    api.obtenerSesion.mockImplementation(async () => ({ ...sesion }));
    api.definirVentanas.mockImplementation(async (_, ventanas) => { sesion = { ...sesion!, window_count: ventanas }; return { ...sesion }; });
    api.tragosDeSesion.mockImplementation(async () => [...tragos]);
    api.agregarTrago.mockImplementation(async (_, id) => { tragos.push({ drinking_session_id: 's1', drink_id: id, drunk_on: new Date().toISOString(), drinks: { id, brand: id === 'c1' ? 'Corona' : 'Austral' } }); });
    api.quitarTrago.mockImplementation(async () => { tragos.pop(); });
    api.terminarSesion.mockImplementation(async (_, motivo, fin) => {
      sesion = { ...sesion!, end_reason: motivo, end_time: fin }; return { ...sesion };
    });
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { usuario: vi.fn().mockResolvedValue({ id: 'u1' }) } },
      { provide: SessionsService, useValue: api },
    ] });
    fixture = TestBed.createComponent(Tab1Page); page = fixture.componentInstance;
    await page.ionViewWillEnter();
  });
  afterEach(() => { fixture.destroy(); vi.useRealTimers(); vi.restoreAllMocks(); });

  async function sumar(id = 'c1') { page.abrirSelectorCerveza(); await page.confirmarCerveza(id); }

  it('carga el catálogo real e inicia las ventanas guardando su cantidad', async () => {
    expect(page.opcionesCervezas()[0]).toEqual({ valor: 'c1', etiqueta: 'Corona' });
    await page.confirmarVentanas('6');
    expect(api.iniciarSesion).toHaveBeenCalledWith('u1', 6);
    expect(page.tiempoRestante()).toBe('07:00:00');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('07:00:00');
  });

  it('no crea ventanas inválidas ni crea otra mientras hay una activa', async () => {
    await page.confirmarVentanas('7'); await page.confirmarVentanas('0');
    expect(api.iniciarSesion).not.toHaveBeenCalled();
    await page.confirmarVentanas('1'); await page.confirmarVentanas('2');
    expect(api.iniciarSesion).toHaveBeenCalledTimes(1);
  });

  it('recupera inicio, duración y consumos al volver a entrar', async () => {
    await page.confirmarVentanas('2'); await sumar();
    vi.setSystemTime(new Date('2026-09-28T15:10:00Z'));
    await page.cargar();
    expect(page.tiempoRestante()).toBe('02:10:00');
    expect(page.cantidadCervezas()).toBe(1);
    expect(api.iniciarSesion).toHaveBeenCalledTimes(1);
  });

  it('suma por ID real y resta la última cerveza global pasando su marca al servicio', async () => {
    await page.confirmarVentanas('1'); await sumar(); await sumar('c2');
    expect(api.agregarTrago).toHaveBeenLastCalledWith('s1', 'c2');
    await page.restarCerveza();
    expect(api.quitarTrago).toHaveBeenCalledWith('s1', 'c2');
    expect(page.ultimaCerveza()).toBe('Corona');
    await page.restarCerveza(); await page.restarCerveza();
    expect(page.cantidadCervezas()).toBe(0);
    expect(api.quitarTrago).toHaveBeenCalledTimes(2);
  });

  it('no registra marcas inválidas ni registra sin confirmación del selector', async () => {
    await page.confirmarVentanas('1');
    await page.confirmarCerveza('c1');
    page.abrirSelectorCerveza(); await page.confirmarCerveza('invalida');
    expect(api.agregarTrago).not.toHaveBeenCalled();
  });

  it('el fin automático conserva la hora prevista aunque la pestaña haya estado suspendida', async () => {
    await page.confirmarVentanas('1');
    vi.setSystemTime(new Date('2026-09-28T17:00:00Z'));
    page.actualizarTiempo();
    await vi.advanceTimersByTimeAsync(1);
    expect(api.terminarSesion).toHaveBeenCalledWith('s1', 'tiempo', '2026-09-28T16:10:00.000Z');
    expect(page.sesionActiva()).toBe(false);
    await sumar(); expect(api.agregarTrago).not.toHaveBeenCalled();
  });

  it('detener antes del tiempo guarda embriaguez y no envía cierres duplicados', async () => {
    await page.confirmarVentanas('1');
    await page.detenerPorEmbriaguez(); await page.detenerPorEmbriaguez();
    expect(api.terminarSesion).toHaveBeenCalledWith('s1', 'embriaguez', '2026-09-28T15:00:00.000Z');
    expect(api.terminarSesion).toHaveBeenCalledTimes(1);
  });

  it('bloquea consumos si falla un cierre y reintenta conservando su motivo y hora', async () => {
    await page.confirmarVentanas('1');
    api.terminarSesion.mockRejectedValueOnce(new Error('Red'));
    await page.detenerPorEmbriaguez();
    expect(page.puedeConsumir()).toBe(false);
    vi.setSystemTime(new Date('2026-09-28T18:00:00Z'));
    page.actualizarTiempo();
    expect(api.terminarSesion).toHaveBeenCalledTimes(1);
    await page.reintentarCierre();
    expect(api.terminarSesion).toHaveBeenLastCalledWith('s1', 'embriaguez', '2026-09-28T15:00:00.000Z');
    expect(page.cierrePendiente()).toBeNull();
  });

  it('recupera un inicio cuya respuesta se perdió sin volver a insertar', async () => {
    api.iniciarSesion.mockImplementationOnce(async () => { sesion = crearSesion(); throw new Error('Respuesta perdida'); });
    await page.confirmarVentanas('1');
    await page.confirmarVentanas('1');
    expect(api.iniciarSesion).toHaveBeenCalledTimes(1);
    expect(page.requiereRecarga()).toBe(true);
    await page.cargar();
    expect(page.sesionActiva()).toBe(true);
    expect(page.requiereRecarga()).toBe(false);
  });

  it('conserva el código y mensaje de Supabase para diagnosticar un inicio fallido', async () => {
    api.iniciarSesion.mockRejectedValueOnce({
      code: '42501', message: 'new row violates row-level security policy for table "drinking_sessions"',
    });
    await page.confirmarVentanas('1');
    expect(console.error).toHaveBeenCalledWith('Error al confirmar ventana en Supabase:', {
      codigo: '42501', mensaje: 'new row violates row-level security policy for table "drinking_sessions"',
    });
    expect(page.requiereRecarga()).toBe(true);
    expect(page.sesionActiva()).toBe(false);
  });

  it('muestra el contador remoto incluso si se perdió la respuesta de una inserción', async () => {
    await page.confirmarVentanas('1');
    api.agregarTrago.mockImplementationOnce(async () => {
      tragos.push({ drinking_session_id: 's1', drink_id: 'c1', drunk_on: new Date().toISOString(), drinks: { id: 'c1', brand: 'Corona' } });
      throw new Error('Respuesta perdida');
    });
    await sumar();
    expect(page.cantidadCervezas()).toBe(1);
    expect(page.error()).toContain('contador actualizado');
  });

  it('no inventa duración para una sesión antigua y permite definirla', async () => {
    sesion = crearSesion(null); await page.cargar();
    expect(page.sesionActiva()).toBe(true);
    expect(page.ventanasSeleccionadas()).toBeNull();
    expect(page.puedeConsumir()).toBe(false);
    await page.confirmarVentanas('2');
    expect(api.definirVentanas).toHaveBeenCalledWith('s1', 2);
    expect(api.iniciarSesion).not.toHaveBeenCalled();
    expect(page.puedeConsumir()).toBe(true);
  });

  it('bloquea operaciones si no se pudo cargar la sesión', async () => {
    api.sesionActiva.mockRejectedValue(new Error('Red'));
    await page.cargar(); await page.confirmarVentanas('1');
    expect(page.error()).toContain('No se pudo cargar');
    expect(api.iniciarSesion).not.toHaveBeenCalled();
  });
  it('conserva un cierre pendiente al volver a la pestaña del mismo usuario', async () => {
    await page.confirmarVentanas('1');
    api.terminarSesion.mockRejectedValueOnce(new Error('Red'));
    await page.detenerPorEmbriaguez();
    await page.cargar();
    expect(page.cierrePendiente()?.motivo).toBe('embriaguez');
    expect(page.puedeConsumir()).toBe(false);
    await page.reintentarCierre();
    expect(page.sesionActiva()).toBe(false);
  });

  it('no envía una segunda operación de consumo mientras espera la primera', async () => {
    await page.confirmarVentanas('1');
    let terminar!: () => void;
    api.agregarTrago.mockReturnValueOnce(new Promise<void>((resolve) => { terminar = resolve; }));
    const pendiente = sumar();
    await sumar(); await page.restarCerveza();
    expect(api.agregarTrago).toHaveBeenCalledTimes(1);
    expect(api.quitarTrago).not.toHaveBeenCalled();
    terminar(); await pendiente;
    expect(page.guardando()).toBe(false);
  });

});
