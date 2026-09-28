import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonFooter } from '@ionic/angular';
import { DatosRecuerdo, RecuerdoService } from '../../services/recuerdo.service';

@Component({
  selector: 'app-recuerdo-modal',
  templateUrl: './recuerdo-modal.component.html',
  styleUrls: ['./recuerdo-modal.component.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonFooter],
})
export class RecuerdoModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) datos!: DatosRecuerdo;
  @Output() cerrado = new EventEmitter<void>();

  private servicio = inject(RecuerdoService);
  private destruido = false;
  imagenUrl = signal('');
  generando = signal(false);
  error = signal('');

  ngOnInit() {
    void this.generar();
  }

  async generar() {
    if (this.generando()) return;
    this.generando.set(true);
    this.error.set('');
    try {
      const archivo = await this.servicio.generar(this.datos);
      // El usuario puede cerrar el modal mientras se carga su foto.
      if (this.destruido) return;
      this.liberarImagen();
      this.imagenUrl.set(URL.createObjectURL(archivo));
    } catch (error) {
      if (!this.destruido) this.error.set(error instanceof Error ? error.message : 'No se pudo generar el recuerdo.');
    } finally {
      this.generando.set(false);
    }
  }

  ngOnDestroy() {
    this.destruido = true;
    this.liberarImagen();
  }

  private liberarImagen() {
    if (this.imagenUrl()) URL.revokeObjectURL(this.imagenUrl());
    this.imagenUrl.set('');
  }
}
