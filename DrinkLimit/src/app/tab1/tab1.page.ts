import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { IonHeader, IonContent, IonButton, IonModal } from '@ionic/angular';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';
import { OpcionSelector, SelectorModalComponent } from '../components/selector-modal/selector-modal.component';
import { MotivoCierre } from '../models/sesion-finalizada.model';
import { AuthService } from '../services/auth.service';
import { Drink, DrinkingSession, SessionDrink, SessionsService } from '../services/drinking-sessions.service';
import { FotoEventoComponent } from '../components/foto-evento/foto-evento.component';

@Component({
  selector: 'app-tab1', templateUrl: 'tab1.page.html', styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonContent, IonButton, IonModal, EncabezadoComponent, SelectorModalComponent, FotoEventoComponent],
})
export class Tab1Page implements OnDestroy {
  private auth = inject(AuthService);
  private servicio = inject(SessionsService);
  private userId = '';
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private destruido = false;
  private versionCarga = 0;
  private sesion = signal<DrinkingSession | null>(null);
  sesionTerminada = computed(() => this.sesion()?.end_time ? this.sesion() : null);
  guardandoFoto = signal(false);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  requiereRecarga = signal(false);
  cierrePendiente = signal<{ motivo: MotivoCierre; fin: string } | null>(null);
  selectorAbierto = signal(false);
  selectorCervezaAbierto = signal(false);
  opcionesCervezas = signal<OpcionSelector[]>([]);
  ventanasSeleccionadas = computed(() => this.sesion()?.window_count ?? null);
  sesionActiva = computed(() => !!this.sesion() && this.sesion()!.end_time === null);
  motivoCierre = computed(() => this.sesion()?.end_reason ?? null);
  tiempoAgotado = computed(() => this.motivoCierre() === 'tiempo');
  segundosRestantes = signal(0);
  consumos = signal<(SessionDrink & { drinks: Drink })[]>([]);
  cantidadCervezas = computed(() => this.consumos().length);
  ultimaCerveza = computed(() => this.consumos().at(-1)?.drinks?.brand ?? '');
  puedeConsumir = computed(() => this.sesionActiva() && this.ventanasSeleccionadas() !== null &&
    this.segundosRestantes() > 0 && !this.cargando() && !this.guardando() && !this.requiereRecarga() && !this.cierrePendiente());
  opcionesVentanas: OpcionSelector[] = [1, 2, 3, 4, 5, 6].map((cantidad) => ({
    valor: String(cantidad), etiqueta: cantidad === 1 ? '1 ventana' : `${cantidad} ventanas seguidas`,
    detalle: `Duración total: ${this.formatearTiempo(cantidad * 70 * 60)}`,
  }));
  duracionSeleccionada = computed(() => this.formatearTiempo((this.ventanasSeleccionadas() ?? 0) * 70 * 60));
  tiempoRestante = computed(() => this.formatearTiempo(this.segundosRestantes()));

  async ionViewWillEnter() { await this.cargar(); }

  async cargar() {
    if (this.guardando()) return;
    const version = ++this.versionCarga;
    const pendiente = this.cierrePendiente();
    const sesionAnterior = this.sesion()?.id;
    this.detenerIntervalo();
    this.cargando.set(true);
    this.error.set('');
    this.requiereRecarga.set(false);
    this.sesion.set(null);
    this.consumos.set([]);
    this.opcionesCervezas.set([]);
    this.cierrePendiente.set(null);
    this.userId = '';
    try {
      const usuario = await this.auth.usuario();
      if (version !== this.versionCarga || this.destruido) return;
      if (!usuario) throw new Error('Sin sesión');
      this.userId = usuario.id;
      const [catalogo, activa] = await Promise.all([
        this.servicio.listaDrinks(), this.servicio.sesionActiva(usuario.id),
      ]);
      const consumos = activa ? await this.servicio.tragosDeSesion(activa.id) : [];
      if (this.destruido || version !== this.versionCarga) return;
      this.opcionesCervezas.set(catalogo.map((cerveza) => ({ valor: cerveza.id, etiqueta: cerveza.brand })));
      this.sesion.set(activa ?? null);
      if (activa?.id === sesionAnterior) this.cierrePendiente.set(pendiente);
      this.consumos.set(consumos);
      this.intervalo = setInterval(() => this.actualizarTiempo(), 1000);
    } catch {
      if (version !== this.versionCarga || this.destruido) return;
      this.requiereRecarga.set(true);
      this.error.set('No se pudo cargar tu sesión. Comprueba tu conexión y vuelve a intentar.');
    } finally {
      if (version === this.versionCarga && !this.destruido) {
        this.cargando.set(false);
        this.actualizarTiempo();
      }
    }
  }

  abrirSelector() {
    if (this.cargando() || this.guardando() || this.requiereRecarga()) return;
    if (this.sesionActiva() && this.ventanasSeleccionadas() !== null) return;
    this.selectorAbierto.set(true);
  }
  cerrarSelector() { this.selectorAbierto.set(false); }

  async confirmarVentanas(valor: string) {
    if (this.cargando() || this.guardando() || this.requiereRecarga() || !this.userId) return;
    if (this.sesionActiva() && this.ventanasSeleccionadas() !== null) return;
    if (!this.opcionesVentanas.some((opcion) => opcion.valor === valor)) return;
    this.guardando.set(true);
    this.error.set('');
    try {
      const activa = this.sesionActiva() ? this.sesion() : null;
      const sesion = activa ? await this.servicio.definirVentanas(activa.id, Number(valor)) :
        await this.servicio.iniciarSesion(this.userId, Number(valor));
      this.sesion.set(sesion);
      if (!activa) this.consumos.set([]);
      this.cierrePendiente.set(null);
      this.cerrarSelector();
    } catch (error: unknown) {
      const fallo = error as { code?: string; message?: string } | null;
      // Registrar solo el diagnóstico, sin sesión, claves ni tokens del usuario.
      console.error('Error al confirmar ventana en Supabase:', {
        codigo: fallo?.code ?? 'sin_codigo',
        mensaje: fallo?.message ?? 'Error sin descripción',
      });
      // La escritura puede haber llegado al servidor aunque su respuesta se pierda.
      // Recargar recupera esa sesión antes de permitir intentar crear otra.
      this.requiereRecarga.set(true);
      this.cerrarSelector();
      this.error.set('No se pudo confirmar la ventana. Pulsa Recargar para comprobar su estado.');
    } finally {
      this.guardando.set(false);
      this.actualizarTiempo();
    }
  }

  abrirSelectorCerveza() {
    this.actualizarTiempo();
    if (this.puedeConsumir() && this.opcionesCervezas().length) this.selectorCervezaAbierto.set(true);
  }
  cerrarSelectorCerveza() { this.selectorCervezaAbierto.set(false); }

  async confirmarCerveza(drinkId: string) {
    this.actualizarTiempo();
    if (!this.puedeConsumir() || !this.selectorCervezaAbierto()) return;
    if (!this.opcionesCervezas().some((opcion) => opcion.valor === drinkId)) return;
    this.cerrarSelectorCerveza();
    await this.cambiarConsumo(() => this.servicio.agregarTrago(this.sesion()!.id, drinkId));
  }

  async restarCerveza() {
    this.actualizarTiempo();
    const ultima = this.consumos().at(-1);
    if (!this.puedeConsumir() || !ultima) return;
    await this.cambiarConsumo(() => this.servicio.quitarTrago(this.sesion()!.id, ultima.drink_id));
  }

  private async cambiarConsumo(operacion: () => Promise<void>) {
    const id = this.sesion()!.id;
    this.guardando.set(true);
    this.error.set('');
    try {
      await operacion();
    } catch {
      this.error.set('No se pudo confirmar el cambio. Revisa el contador actualizado antes de volver a intentar.');
    }
    try {
      const [sesion, consumos] = await Promise.all([this.servicio.obtenerSesion(id), this.servicio.tragosDeSesion(id)]);
      this.sesion.set(sesion);
      this.consumos.set(consumos);
    } catch {
      this.requiereRecarga.set(true);
      this.error.set('No se pudo actualizar el contador. Pulsa Recargar antes de seguir.');
    } finally {
      this.guardando.set(false);
      this.actualizarTiempo();
    }
  }

  async detenerPorEmbriaguez() {
    this.actualizarTiempo();
    if (this.puedeConsumir()) await this.finalizarSesion('embriaguez');
  }

  async reintentarCierre() {
    const pendiente = this.cierrePendiente();
    if (pendiente) await this.finalizarSesion(pendiente.motivo);
  }

  @HostListener('document:visibilitychange')
  actualizarTiempo() {
    const sesion = this.sesion();
    if (this.destruido || !sesion || !this.sesionActiva() || !sesion.window_count) return;
    const fin = Date.parse(sesion.start_time) + sesion.window_count * 70 * 60 * 1000;
    this.segundosRestantes.set(Math.max(0, Math.ceil((fin - Date.now()) / 1000)));
    if (!this.segundosRestantes() && !this.cargando() && !this.guardando() && !this.requiereRecarga() && !this.cierrePendiente()) {
      void this.finalizarSesion('tiempo');
    }
  }

  private async finalizarSesion(motivo: MotivoCierre) {
    const sesion = this.sesion();
    if (!sesion || !this.sesionActiva() || this.guardando()) return;
    const fin = motivo === 'tiempo' ? Date.parse(sesion.start_time) + sesion.window_count! * 70 * 60 * 1000 : Date.now();
    const pendiente = this.cierrePendiente() ?? { motivo, fin: new Date(fin).toISOString() };
    this.cierrePendiente.set(pendiente);
    this.cerrarSelectorCerveza();
    this.guardando.set(true);
    this.error.set('');
    try {
      const cerrada = await this.servicio.terminarSesion(sesion.id, pendiente.motivo, pendiente.fin);
      if (!cerrada.end_time) throw new Error('No se confirmó el cierre');
      this.sesion.set(cerrada);
      this.cierrePendiente.set(null);
    } catch {
      this.error.set('No se pudo confirmar el cierre. No puedes agregar cervezas mientras el cierre esté pendiente.');
    } finally {
      this.guardando.set(false);
    }
  }

  ngOnDestroy() { this.destruido = true; this.detenerIntervalo(); }
  private detenerIntervalo() {
    if (this.intervalo !== null) clearInterval(this.intervalo);
    this.intervalo = null;
  }
  private formatearTiempo(segundosTotales: number): string {
    return [Math.floor(segundosTotales / 3600), Math.floor((segundosTotales % 3600) / 60), segundosTotales % 60]
      .map((valor) => String(valor).padStart(2, '0')).join(':');
  }
}
