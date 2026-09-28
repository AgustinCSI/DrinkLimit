import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SessionsService } from './drinking-sessions.service';
import { SesionFinalizada } from '../models/sesion-finalizada.model';

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private auth = inject(AuthService);
  private sesionesRemotas = inject(SessionsService);
  private registros = signal<SesionFinalizada[]>([]);
  private solicitud = 0;
  sesiones = this.registros.asReadonly();
  cargando = signal(false);
  error = signal('');
  cargado = signal(false);
  motivosDesconocidos = computed(() => this.registros().some((sesion) => !sesion.motivoCierre));
  private datosDisponibles = computed(() => this.cargado() && !this.cargando() && !this.error());
  // El historial ya viene del más reciente al más antiguo: conserva el primero en un empate.
  sesionTope = computed(() => {
    if (!this.datosDisponibles()) return null;
    return this.registros().reduce<SesionFinalizada | null>((mayor, sesion) =>
      !mayor || sesion.consumos.length > mayor.consumos.length ? sesion : mayor, null);
  });

  vecesCurado = computed(() => !this.datosDisponibles() || this.motivosDesconocidos() ? null :
    this.registros().filter((sesion) => sesion.motivoCierre === 'embriaguez').length);
  topeTragos = computed(() => !this.datosDisponibles() || !this.registros().length ? null :
    Math.max(...this.registros().map((sesion) => sesion.consumos.length)));
  limitePersonal = computed(() => {
    if (!this.datosDisponibles() || this.motivosDesconocidos()) return null;
    const sesiones = this.registros().filter((sesion) => sesion.motivoCierre === 'embriaguez');
    return sesiones.length ? Math.max(...sesiones.map((sesion) => sesion.consumos.length)) : null;
  });

  async cargar() {
    const solicitud = ++this.solicitud;
    this.registros.set([]);
    this.cargando.set(true);
    this.cargado.set(false);
    this.error.set('');
    try {
      const usuario = await this.auth.usuario();
      if (!usuario) throw new Error('Sin sesión');
      const sesiones = await this.sesionesRemotas.historial(usuario.id);
      const registros = await Promise.all(sesiones.map(async (sesion): Promise<SesionFinalizada> => {
        const tragos = await this.sesionesRemotas.tragosDeSesion(sesion.id);
        return {
          id: sesion.id, inicio: sesion.start_time, fin: sesion.end_time!,
          ventanas: sesion.window_count ?? null, motivoCierre: sesion.end_reason ?? null,
          fotoUrl: sesion.photo_url ?? null,
          consumos: tragos.map((trago) => ({ marca: trago.drinks?.brand ?? 'Cerveza', fecha: trago.drunk_on })),
        };
      }));
      if (solicitud !== this.solicitud) return;
      this.registros.set(registros);
      this.cargado.set(true);
    } catch {
      if (solicitud === this.solicitud) this.error.set('No se pudo cargar el historial. Comprueba tu conexión e intenta nuevamente.');
    } finally {
      if (solicitud === this.solicitud) this.cargando.set(false);
    }
  }
}
