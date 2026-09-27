import { Injectable, computed, signal } from '@angular/core';
import { SesionFinalizada } from '../models/sesion-finalizada.model';

@Injectable({ providedIn: 'root' })
export class HistorialLocalService {
  private registros = signal<SesionFinalizada[]>([]);
  private siguienteId = 1;

  sesiones = this.registros.asReadonly();

  vecesCurado = computed(() => this.registros().filter((sesion) => sesion.motivoCierre === 'embriaguez').length);

  topeTragos = computed(() => {
    const sesiones = this.registros();
    return sesiones.length === 0 ? null : Math.max(...sesiones.map((sesion) => sesion.consumos.length));
  });

  limitePersonal = computed(() => {
    const sesiones = this.registros().filter((sesion) => sesion.motivoCierre === 'embriaguez');
    return sesiones.length === 0 ? null : Math.max(...sesiones.map((sesion) => sesion.consumos.length));
  });

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
