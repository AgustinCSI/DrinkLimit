import { Component } from '@angular/core';
import { IonHeader, IonContent } from '@ionic/angular';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonContent, EncabezadoComponent]
})
export class Tab2Page {

  constructor() {}

}
