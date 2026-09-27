import { Component, HostListener, OnDestroy, computed, signal } from '@angular/core';
import { IonHeader, IonContent, IonButton, IonModal } from '@ionic/angular';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';
import { OpcionSelector, SelectorModalComponent } from '../components/selector-modal/selector-modal.component';
import { Consumo } from '../models/consumo.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonContent, IonButton, IonModal, EncabezadoComponent, SelectorModalComponent],
})
export class Tab1Page implements OnDestroy {
  selectorAbierto = signal(false);
  selectorCervezaAbierto = signal(false);
  ventanasSeleccionadas = signal<number | null>(null);
  sesionActiva = signal(false);
  motivoCierre = signal<'tiempo' | 'embriaguez' | null>(null);
  tiempoAgotado = computed(() => this.motivoCierre() === 'tiempo');
  segundosRestantes = signal(0);
  consumos = signal<Consumo[]>([]);
  cantidadCervezas = computed(() => this.consumos().length);
  ultimaCerveza = computed(() => this.consumos().at(-1)?.marca ?? '');

  private finVentana: number | null = null;
  private intervalo: ReturnType<typeof setInterval> | null = null;

  opcionesVentanas: OpcionSelector[] = [1, 2, 3, 4, 5, 6].map((cantidad) => ({
    valor: String(cantidad),
    etiqueta: cantidad === 1 ? '1 ventana' : `${cantidad} ventanas seguidas`,
    detalle: `Duración total: ${this.calcularDuracion(cantidad)}`,
  }));

  opcionesCervezas: OpcionSelector[] = ['Corona', 'Austral', 'Becker', 'Patagonia', 'Cusqueña']
    .map((marca) => ({ valor: marca, etiqueta: marca }));

  duracionSeleccionada = computed(() => {
    const cantidad = this.ventanasSeleccionadas();
    return cantidad === null ? '' : this.calcularDuracion(cantidad);
  });

  tiempoRestante = computed(() => this.formatearTiempo(this.segundosRestantes()));

  abrirSelector() {
    this.actualizarTiempo();
    if (this.sesionActiva()) return;
    this.selectorAbierto.set(true);
  }

  cerrarSelector() {
    this.selectorAbierto.set(false);
  }

  confirmarVentanas(valor: string) {
    if (this.sesionActiva()) return;
    if (!this.opcionesVentanas.some((opcion) => opcion.valor === valor)) return;

    const cantidad = Number(valor);
    const duracionSegundos = cantidad * 70 * 60;
    this.ventanasSeleccionadas.set(cantidad);
    this.segundosRestantes.set(duracionSegundos);
    this.finVentana = Date.now() + duracionSegundos * 1000;
    this.motivoCierre.set(null);
    this.consumos.set([]);
    this.sesionActiva.set(true);
    this.cerrarSelector();
    this.detenerIntervalo();
    this.intervalo = setInterval(() => this.actualizarTiempo(), 1000);
  }

  abrirSelectorCerveza() {
    this.actualizarTiempo();
    if (!this.sesionActiva()) return;
    this.selectorCervezaAbierto.set(true);
  }

  cerrarSelectorCerveza() {
    this.selectorCervezaAbierto.set(false);
  }

  confirmarCerveza(marca: string) {
    this.actualizarTiempo();
    if (!this.sesionActiva() || !this.selectorCervezaAbierto()) return;
    if (!this.opcionesCervezas.some((opcion) => opcion.valor === marca)) return;

    const consumo: Consumo = { marca, fecha: new Date().toISOString() };
    this.consumos.update((actuales) => [...actuales, consumo]);
    this.cerrarSelectorCerveza();
  }

  restarCerveza() {
    this.actualizarTiempo();
    if (!this.sesionActiva() || this.cantidadCervezas() === 0) return;
    this.consumos.update((actuales) => actuales.slice(0, -1));
  }

  detenerPorEmbriaguez() {
    this.actualizarTiempo();
    if (!this.sesionActiva()) return;
    this.finalizarSesion('embriaguez');
  }

  ionViewWillEnter() {
    this.actualizarTiempo();
  }

  @HostListener('document:visibilitychange')
  actualizarTiempo() {
    if (this.finVentana === null) return;

    // Recalculamos desde la hora de término, incluso si el navegador pausó el intervalo.
    const segundos = Math.max(0, Math.ceil((this.finVentana - Date.now()) / 1000));
    this.segundosRestantes.set(segundos);

    if (segundos === 0) {
      this.finalizarSesion('tiempo');
    }
  }

  ngOnDestroy() {
    this.detenerIntervalo();
  }

  private finalizarSesion(motivo: 'tiempo' | 'embriaguez') {
    this.sesionActiva.set(false);
    this.motivoCierre.set(motivo);
    this.cerrarSelectorCerveza();
    this.finVentana = null;
    this.detenerIntervalo();
  }

  private detenerIntervalo() {
    if (this.intervalo !== null) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }

  private calcularDuracion(cantidad: number): string {
    return this.formatearTiempo(cantidad * 70 * 60);
  }

  private formatearTiempo(segundosTotales: number): string {
    const horas = Math.floor(segundosTotales / 3600);
    const minutos = Math.floor((segundosTotales % 3600) / 60);
    const segundos = segundosTotales % 60;
    return [horas, minutos, segundos]
      .map((valor) => String(valor).padStart(2, '0'))
      .join(':');
  }
}
