import { HistorialLocalService } from './historial-local.service';
import { SesionFinalizada } from '../models/sesion-finalizada.model';

describe('HistorialLocalService', () => {
  const crearSesion = (): Omit<SesionFinalizada, 'id'> => ({
    inicio: '2026-09-27T18:00:00.000Z',
    fin: '2026-09-27T19:10:00.000Z',
    ventanas: 1,
    motivoCierre: 'tiempo',
    consumos: [{ marca: 'Corona', fecha: '2026-09-27T18:05:00.000Z' }],
  });

  it('conserva las sesiones anteriores y muestra la última primero con un id distinto', () => {
    const servicio = new HistorialLocalService();
    expect(servicio.sesiones()).toEqual([]);
    servicio.guardar(crearSesion());
    servicio.guardar({ ...crearSesion(), motivoCierre: 'embriaguez' });
    expect(servicio.sesiones().map((sesion) => sesion.motivoCierre)).toEqual(['embriaguez', 'tiempo']);
    expect(new Set(servicio.sesiones().map((sesion) => sesion.id)).size).toBe(2);
  });

  it('los cambios en el consumo original no alteran una sesión guardada', () => {
    const servicio = new HistorialLocalService();
    const datos = crearSesion();
    servicio.guardar(datos);
    datos.consumos[0]!.marca = 'Austral';
    datos.consumos.push({ marca: 'Becker', fecha: datos.fin });
    expect(servicio.sesiones()[0]!.consumos).toEqual([
      { marca: 'Corona', fecha: '2026-09-27T18:05:00.000Z' },
    ]);
  });
});
