import { SessionsService } from './drinking-sessions.service';
import { supabase } from './supabase.client';

describe('SessionsService: consultas de persistencia', () => {
  afterEach(() => vi.restoreAllMocks());

  function consulta() {
    const builder = {
      select: vi.fn(), update: vi.fn(), eq: vi.fn(), is: vi.fn(), not: vi.fn(), order: vi.fn(), range: vi.fn(),
      maybeSingle: vi.fn(), single: vi.fn(),
    };
    for (const metodo of [builder.select, builder.update, builder.eq, builder.is, builder.not, builder.order]) metodo.mockReturnValue(builder);
    return builder;
  }

  it('reintentar un cierre no sobrescribe una sesión que ya terminó', async () => {
    const actualizar = consulta();
    const leer = consulta();
    const cerrada = { id: 's1', end_reason: 'tiempo', end_time: '2026-09-28T16:10:00Z' };
    actualizar.maybeSingle.mockResolvedValue({ data: null, error: null });
    leer.single.mockResolvedValue({ data: cerrada, error: null });
    vi.spyOn(supabase, 'from').mockReturnValueOnce(actualizar as never).mockReturnValueOnce(leer as never);
    const resultado = await new SessionsService().terminarSesion('s1', 'embriaguez', '2026-09-28T16:11:00Z');
    expect(actualizar.is).toHaveBeenCalledWith('end_time', null);
    expect(resultado).toBe(cerrada);
    expect(leer.eq).toHaveBeenCalledWith('id', 's1');
  });

  it('no reemplaza una duración que ya fue definida', async () => {
    const actualizar = consulta(); const leer = consulta();
    actualizar.maybeSingle.mockResolvedValue({ data: null, error: null });
    leer.single.mockResolvedValue({ data: { id: 's1', window_count: 2 }, error: null });
    vi.spyOn(supabase, 'from').mockReturnValueOnce(actualizar as never).mockReturnValueOnce(leer as never);
    expect((await new SessionsService().definirVentanas('s1', 1)).window_count).toBe(2);
    expect(actualizar.is).toHaveBeenCalledWith('window_count', null);
  });

  it('carga todas las páginas del historial del usuario', async () => {
    const builder = consulta();
    builder.range.mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => ({ id: String(i) })), error: null })
      .mockResolvedValueOnce({ data: [{ id: '500' }], error: null });
    vi.spyOn(supabase, 'from').mockReturnValue(builder as never);
    expect((await new SessionsService().historial('u1')).length).toBe(501);
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(builder.range.mock.calls).toEqual([[0, 499], [500, 999]]);
  });
});
