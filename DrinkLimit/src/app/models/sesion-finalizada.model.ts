import { Consumo } from './consumo.model';

export type MotivoCierre = 'tiempo' | 'embriaguez';

export interface SesionFinalizada {
  id: string;
  inicio: string;
  fin: string;
  ventanas: number | null;
  motivoCierre: MotivoCierre | null;
  consumos: Consumo[];
  fotoUrl?: string | null;
}
