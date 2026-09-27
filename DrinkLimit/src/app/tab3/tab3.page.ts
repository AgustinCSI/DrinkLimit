import { Component } from '@angular/core';
import { IonHeader, IonContent } from '@ionic/angular';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [IonHeader, IonContent, EncabezadoComponent],
})
export class Tab3Page {
  constructor() {}
}
