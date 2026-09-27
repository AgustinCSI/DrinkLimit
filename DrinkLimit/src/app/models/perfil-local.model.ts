export type Sexo = 'M' | 'F' | 'Otro';

export interface PerfilLocal {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: Sexo;
  foto: string | null;
}

export type DatosPerfilEditables = Pick<PerfilLocal, 'first_name' | 'last_name' | 'gender' | 'foto'>;
