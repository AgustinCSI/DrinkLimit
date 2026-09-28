import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { IonButton } from '@ionic/angular';
import { FotosService } from '../../services/fotos.service';
import { SessionsService } from '../../services/drinking-sessions.service';

@Component({
  selector: 'app-foto-evento',
  templateUrl: './foto-evento.component.html',
  styleUrls: ['./foto-evento.component.scss'],
  imports: [IonButton],
})
export class FotoEventoComponent {
  @Input({ required: true }) sesionId!: string;
  @Input() fotoUrl: string | null = null;
  @Output() guardada = new EventEmitter<string>();
  @Output() ocupada = new EventEmitter<boolean>();
  private fotos = inject(FotosService);
  private sesiones = inject(SessionsService);
  // Conservamos la URL si Storage funcionó pero falló su asociación al evento.
  private urlPendiente: string | null = null;
  private archivoPendiente: File | null = null;
  guardando = signal(false);
  error = signal('');
  aviso = signal('');

  async seleccionar(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo || this.guardando()) return;
    this.error.set('');
    this.aviso.set('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.error.set('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.error.set('La imagen debe pesar como máximo 5 MB.');
      return;
    }
    this.archivoPendiente = archivo;
    this.urlPendiente = null;
    await this.guardar();
  }

  async guardar() {
    if (!this.archivoPendiente || this.guardando()) return;
    const id = this.sesionId;
    this.guardando.set(true);
    this.ocupada.emit(true);
    this.error.set('');
    let paso = 'subir la imagen a Storage';
    try {
      this.urlPendiente ??= await this.fotos.cargar(this.archivoPendiente);
      paso = 'adjuntar la imagen a la sesión';
      const sesion = await this.sesiones.guardarFoto(id, this.urlPendiente);
      if (!sesion.photo_url) throw new Error('Foto sin confirmar');
      this.fotoUrl = sesion.photo_url;
      this.archivoPendiente = null;
      this.urlPendiente = null;
      this.aviso.set('Foto adjunta al evento.');
      this.guardada.emit(sesion.photo_url);
    } catch (error: unknown) {
      const fallo = error as { code?: string; statusCode?: string | number; message?: string } | null;
      const codigo = fallo?.code ?? fallo?.statusCode ?? 'sin_codigo';
      // Texto directo para poder leer el detalle sin desplegar un Object en la consola.
      console.error(`Foto del evento: fallo al ${paso}. Código: ${codigo}. ${fallo?.message ?? 'Error sin descripción'}`);
      this.error.set(`No se pudo ${paso} (código: ${codigo}). La sesión sigue guardada; puedes reintentar.`);
    } finally {
      this.guardando.set(false);
      this.ocupada.emit(false);
    }
  }

  puedeReintentar() { return !!this.archivoPendiente; }
}
