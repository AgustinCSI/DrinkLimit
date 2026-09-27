import { Injectable, signal } from '@angular/core';
import { SesionFinalizada } from '../models/sesion-finalizada.model';

@Injectable({ providedIn: 'root' })
export class HistorialLocalService {
  private registros = signal<SesionFinalizada[]>([]);
  private siguienteId = 1;

  sesiones = this.registros.asReadonly();

  guardar(datos: Omit<SesionFinalizada, 'id'>) {
    const sesion: SesionFinalizada = {
      ...datos,
      id: this.siguienteId++,
      // Copiamos los consumos para independizar el historial de la sesión de Inicio.
      consumos: datos.consumos.map((consumo) => ({ ...consumo })),
    };
    this.registros.update((actuales) => [sesion, ...actuales]);
  }
}
