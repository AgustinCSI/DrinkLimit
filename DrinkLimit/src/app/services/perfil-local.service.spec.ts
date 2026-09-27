import { PerfilLocalService } from './perfil-local.service';

describe('PerfilLocalService', () => {
  it('guarda los datos editables sin permitir cambiar la fecha de nacimiento', () => {
    const servicio = new PerfilLocalService();
    const nacimiento = servicio.perfil().birth_date;
    const cambios = {
      first_name: ' Ana ', last_name: ' Pérez ', gender: 'F' as const,
      foto: 'data:image/png;base64,ejemplo', birth_date: '2000-01-01',
    };
    servicio.guardar(cambios);
    expect(servicio.perfil()).toEqual({
      first_name: 'Ana', last_name: 'Pérez', gender: 'F', foto: cambios.foto, birth_date: nacimiento,
    });
  });

  it('rechaza nombres vacíos sin modificar el perfil', () => {
    const servicio = new PerfilLocalService();
    const original = servicio.perfil();
    expect(() => servicio.guardar({ ...original, first_name: '  ' })).toThrow('Completa');
    expect(servicio.perfil()).toBe(original);
  });
});
