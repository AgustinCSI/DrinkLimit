import { Injectable, signal } from '@angular/core';
import { DatosPerfilEditables, PerfilLocal } from '../models/perfil-local.model';

@Injectable({ providedIn: 'root' })
export class PerfilLocalService {
  private datos = signal<PerfilLocal>({
    first_name: 'Martín',
    last_name: 'Ejemplo',
    birth_date: '2005-05-14',
    gender: 'M',
    foto: null,
  });

  perfil = this.datos.asReadonly();

  guardar(cambios: DatosPerfilEditables) {
    const nombre = cambios.first_name.trim();
    const apellido = cambios.last_name.trim();
    if (!nombre || !apellido) throw new Error('Completa el nombre y el apellido.');
    if (!['M', 'F', 'Otro'].includes(cambios.gender)) throw new Error('Selecciona un sexo válido.');

    // Solo copiamos los campos editables: birth_date permanece intacta.
    this.datos.update((actuales) => ({
      ...actuales,
      first_name: nombre,
      last_name: apellido,
      gender: cambios.gender,
      foto: cambios.foto,
    }));
  }
}
