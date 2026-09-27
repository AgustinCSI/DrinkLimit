import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonRadioGroup, IonRadio, IonFooter, IonButton,
} from '@ionic/angular';

export interface OpcionSelector {
  valor: string;
  etiqueta: string;
  detalle?: string;
}

@Component({
  selector: 'app-selector-modal',
  templateUrl: './selector-modal.component.html',
  styleUrls: ['./selector-modal.component.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList,
    IonItem, IonRadioGroup, IonRadio, IonFooter, IonButton,
  ],
})
export class SelectorModalComponent implements OnInit {
  @Input() titulo = 'Seleccionar';
  @Input() descripcion = '';
  @Input() opciones: OpcionSelector[] = [];
  @Input() valorInicial = '';

  @Output() confirmado = new EventEmitter<string>();
  @Output() cancelado = new EventEmitter<void>();

  seleccion = signal('');

  ngOnInit() {
    this.seleccion.set(this.valorInicial);
  }

  get opcionSeleccionada(): OpcionSelector | undefined {
    return this.opciones.find((opcion) => opcion.valor === this.seleccion());
  }

  confirmar() {
    const opcion = this.opcionSeleccionada;
    if (opcion) {
      this.confirmado.emit(opcion.valor);
    }
  }
}
