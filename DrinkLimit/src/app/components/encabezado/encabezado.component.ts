import { Component, Input } from '@angular/core';
import { IonToolbar, IonTitle } from '@ionic/angular';

@Component({
  selector: 'app-encabezado',
  templateUrl: './encabezado.component.html',
  styleUrls: ['./encabezado.component.scss'],
  imports: [IonToolbar, IonTitle],
})
export class EncabezadoComponent {
  @Input() titulo = 'DrinkLimit';
}
