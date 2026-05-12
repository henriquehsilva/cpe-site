export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type ModuleKey =
  | 'efetivo'
  | 'planoFerias'
  | 'aniversariantes'
  | 'planoChamada'
  | 'agendaAudiencias'
  | 'medalhas'
  | 'dispencaRecompensa'
  | 'lesp'
  | 'fotos'
  | 'mapaEfetivo'
  | 'armamento';

export type UserPermissions = Record<ModuleKey, ModulePermission>;

export interface AdminUserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  permissions: Partial<UserPermissions>;
}

export const MODULE_LABELS: Record<ModuleKey, string> = {
  efetivo: 'Efetivo',
  planoFerias: 'Plano de Férias',
  aniversariantes: 'Aniversariantes',
  planoChamada: 'Plano de Chamada',
  agendaAudiencias: 'Agenda Audiências',
  medalhas: 'Medalhas',
  dispencaRecompensa: 'Dispensa Recompensa',
  lesp: 'LESP',
  fotos: 'Painel de Fotos',
  mapaEfetivo: 'Mapa do Efetivo',
  armamento: 'Armamento',
};

export const MODULE_ID_TO_KEY: Record<string, ModuleKey> = {
  'efetivo': 'efetivo',
  'plano-ferias': 'planoFerias',
  'aniversariantes': 'aniversariantes',
  'plano-chamada': 'planoChamada',
  'agenda-audiencias': 'agendaAudiencias',
  'medalhas': 'medalhas',
  'dispenca-recompensa': 'dispencaRecompensa',
  'lesp': 'lesp',
  'fotos': 'fotos',
  'mapa-efetivo': 'mapaEfetivo',
  'armamento': 'armamento',
};

export const DEFAULT_MODULE_PERMISSION: ModulePermission = {
  view: false,
  create: false,
  edit: false,
  delete: false,
};

export const DEFAULT_PERMISSIONS: UserPermissions = {
  efetivo: { ...DEFAULT_MODULE_PERMISSION },
  planoFerias: { ...DEFAULT_MODULE_PERMISSION },
  aniversariantes: { ...DEFAULT_MODULE_PERMISSION },
  planoChamada: { ...DEFAULT_MODULE_PERMISSION },
  agendaAudiencias: { ...DEFAULT_MODULE_PERMISSION },
  medalhas: { ...DEFAULT_MODULE_PERMISSION },
  dispencaRecompensa: { ...DEFAULT_MODULE_PERMISSION },
  lesp: { ...DEFAULT_MODULE_PERMISSION },
  fotos: { ...DEFAULT_MODULE_PERMISSION },
  mapaEfetivo: { ...DEFAULT_MODULE_PERMISSION },
  armamento: { ...DEFAULT_MODULE_PERMISSION },
};

export const SUPER_ADMIN_EMAIL = 'sad31chagas@gmail.com';
