import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonHeader, IonContent, IonCard, IonCardContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { imageOutline } from 'ionicons/icons';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';
import { HistorialLocalService } from '../services/historial-local.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonContent, IonCard, IonCardContent, IonIcon, DatePipe, EncabezadoComponent]
})
export class Tab2Page {
  private historial = inject(HistorialLocalService);
  sesiones = this.historial.sesiones;

  constructor() {
    addIcons({ imageOutline });
  }
}
