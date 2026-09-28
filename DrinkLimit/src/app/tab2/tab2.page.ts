import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonHeader, IonContent, IonCard, IonCardContent, IonIcon, IonButton } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { imageOutline } from 'ionicons/icons';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';
import { HistorialService } from '../services/historial.service';
import { FotoEventoComponent } from '../components/foto-evento/foto-evento.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonContent, IonCard, IonCardContent, IonIcon, IonButton, DatePipe, EncabezadoComponent, FotoEventoComponent]
})
export class Tab2Page {
  historial = inject(HistorialService);
  sesiones = this.historial.sesiones;

  async ionViewWillEnter() { await this.historial.cargar(); }

  constructor() {
    addIcons({ imageOutline });
  }
}
