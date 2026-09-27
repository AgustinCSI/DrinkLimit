import { Component } from '@angular/core';
import { IonHeader, IonContent, IonButton } from '@ionic/angular';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonContent, IonButton, EncabezadoComponent],
})
export class Tab1Page {}
