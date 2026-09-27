import { Consumo } from './consumo.model';

export type MotivoCierre = 'tiempo' | 'embriaguez';

export interface SesionFinalizada {
  id: number;
  inicio: string;
  fin: string;
  ventanas: number;
  motivoCierre: MotivoCierre;
  consumos: Consumo[];
}
