import { TestBed } from '@angular/core/testing';
import { FotoEventoComponent } from './foto-evento.component';
import { FotosService } from '../../services/fotos.service';
import { SessionsService } from '../../services/drinking-sessions.service';

describe('Foto opcional del evento', () => {
  const cargar = vi.fn();
  const guardarFoto = vi.fn();
  let componente: FotoEventoComponent;
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    cargar.mockReset().mockResolvedValue('https://example.com/evento.png');
    guardarFoto.mockReset().mockResolvedValue({ photo_url: 'https://example.com/evento.png' });
    TestBed.configureTestingModule({ providers: [
      { provide: FotosService, useValue: { cargar } },
      { provide: SessionsService, useValue: { guardarFoto } },
    ] });
    componente = TestBed.createComponent(FotoEventoComponent).componentInstance;
    componente.sesionId = 'evento-1';
  });
  afterEach(() => vi.restoreAllMocks());
  function seleccionar(archivo: File) {
    return componente.seleccionar({ target: { files: [archivo], value: '' } } as unknown as Event);
  }
  const imagen = () => new File(['imagen'], 'evento.jpg', { type: 'image/jpeg' });

  it('no carga nada hasta seleccionar y asocia la URL al evento correcto', async () => {
    expect(cargar).not.toHaveBeenCalled();
    const emit = vi.spyOn(componente.guardada, 'emit');
    await seleccionar(imagen());
    expect(guardarFoto).toHaveBeenCalledWith('evento-1', 'https://example.com/evento.png');
    expect(emit).toHaveBeenCalledWith('https://example.com/evento.png');
    expect(componente.guardando()).toBe(false);
  });
  it('reintenta la asociación sin subir otra copia cuando falla la base', async () => {
    guardarFoto.mockRejectedValueOnce({ code: 'PGRST204', message: 'Missing photo_url column' });
    await seleccionar(imagen());
    expect(componente.error()).toContain('La sesión sigue guardada');
    expect(componente.error()).toContain('adjuntar la imagen a la sesión (código: PGRST204)');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Missing photo_url column'));
    expect(componente.fotoUrl).toBeNull();
    await componente.guardar();
    expect(cargar).toHaveBeenCalledTimes(1);
    expect(guardarFoto).toHaveBeenCalledTimes(2);
    expect(componente.fotoUrl).toBe('https://example.com/evento.png');
  });
  it('no modifica la sesión si falla Storage y permite reintentar', async () => {
    cargar.mockRejectedValueOnce({ statusCode: '403', message: 'new row violates row-level security policy' });
    await seleccionar(imagen());
    expect(componente.error()).toContain('subir la imagen a Storage (código: 403)');
    expect(guardarFoto).not.toHaveBeenCalled();
    await componente.guardar();
    expect(guardarFoto).toHaveBeenCalledOnce();
  });
  it('rechaza formato y tamaño inválidos antes de subir', async () => {
    await seleccionar(new File(['texto'], 'texto.txt', { type: 'text/plain' }));
    expect(componente.error()).toContain('JPG');
    await seleccionar(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'foto.png', { type: 'image/png' }));
    expect(componente.error()).toContain('5 MB');
    expect(cargar).not.toHaveBeenCalled();
  });
});
