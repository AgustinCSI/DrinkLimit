import { FotosService } from './fotos.service';
import { supabase } from './supabase.client';

describe('FotosService sin crypto.randomUUID', () => {
  const upload = vi.fn();
  const getPublicUrl = vi.fn();

  beforeEach(() => {
    let llamada = 0;
    vi.stubGlobal('crypto', {
      getRandomValues: vi.fn((bytes: Uint8Array) => bytes.fill(++llamada)),
    });
    upload.mockReset().mockResolvedValue({ error: null });
    getPublicUrl.mockReset().mockImplementation((ruta: string) => ({
      data: { publicUrl: `https://example.com/fotos/${ruta}` },
    }));
    vi.spyOn(supabase.storage, 'from').mockReturnValue({ upload, getPublicUrl } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sube dos fotos con nombres distintos conservando extensión y URL', async () => {
    const servicio = new FotosService();
    const archivo = new File(['imagen'], 'evento.png', { type: 'image/png' });
    const primera = await servicio.cargar(archivo);
    const segunda = await servicio.cargar(archivo);
    expect(supabase.storage.from).toHaveBeenCalledWith('fotos');
    expect(upload).toHaveBeenNthCalledWith(1, `${'01'.repeat(16)}.png`, archivo);
    expect(upload).toHaveBeenNthCalledWith(2, `${'02'.repeat(16)}.png`, archivo);
    expect(primera).toBe(`https://example.com/fotos/${'01'.repeat(16)}.png`);
    expect(segunda).not.toBe(primera);
  });

  it('propaga un error real de Storage sin devolver una URL', async () => {
    const error = { statusCode: '403', message: 'No autorizado' };
    upload.mockResolvedValue({ error });
    await expect(new FotosService().cargar(new File(['imagen'], 'evento.jpg'))).rejects.toBe(error);
    expect(getPublicUrl).not.toHaveBeenCalled();
  });
});
