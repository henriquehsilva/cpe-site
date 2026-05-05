export interface AdminTheme {
  id: string;
  name: string;
  swatch: string;
  // CSS variable values
  bg: string;
  surface: string;
  border: string;
  borderHover: string;
  text: string;
  muted: string;
  subtle: string;
  input: string;
  header: string;
  tableHead: string;
  rowEven: string;
  rowHover: string;
  modal: string;
  dropdown: string;
  accent: string;
}

export const THEMES: AdminTheme[] = [
  {
    id: 'caverna',
    name: 'Caverna',
    swatch: '#52525b',
    bg: '#09090b',
    surface: 'rgba(39,39,42,0.28)',
    border: 'rgba(63,63,70,0.45)',
    borderHover: 'rgba(113,113,122,0.65)',
    text: '#fafafa',
    muted: '#a1a1aa',
    subtle: '#71717a',
    input: 'rgba(39,39,42,0.6)',
    header: 'rgba(9,9,11,0.96)',
    tableHead: '#111113',
    rowEven: 'rgba(24,24,27,0.22)',
    rowHover: 'rgba(39,39,42,0.55)',
    modal: '#18181b',
    dropdown: '#1c1c1f',
    accent: '#a1a1aa',
  },
  {
    id: 'floresta',
    name: 'Floresta',
    swatch: '#166534',
    bg: '#030d07',
    surface: 'rgba(20,83,45,0.22)',
    border: 'rgba(22,101,52,0.45)',
    borderHover: 'rgba(34,197,94,0.45)',
    text: '#f0fdf4',
    muted: '#86efac',
    subtle: '#4ade80',
    input: 'rgba(20,83,45,0.32)',
    header: 'rgba(3,13,7,0.96)',
    tableHead: '#041509',
    rowEven: 'rgba(20,83,45,0.12)',
    rowHover: 'rgba(20,83,45,0.32)',
    modal: '#051b0a',
    dropdown: '#071f0d',
    accent: '#4ade80',
  },
  {
    id: 'oceano',
    name: 'Oceano',
    swatch: '#1e3a5f',
    bg: '#02060f',
    surface: 'rgba(30,58,138,0.18)',
    border: 'rgba(37,99,235,0.35)',
    borderHover: 'rgba(96,165,250,0.5)',
    text: '#eff6ff',
    muted: '#93c5fd',
    subtle: '#60a5fa',
    input: 'rgba(30,58,138,0.22)',
    header: 'rgba(2,6,15,0.96)',
    tableHead: '#030a1c',
    rowEven: 'rgba(30,58,138,0.1)',
    rowHover: 'rgba(30,58,138,0.28)',
    modal: '#04091f',
    dropdown: '#060c26',
    accent: '#60a5fa',
  },
  {
    id: 'ardosia',
    name: 'Ardósia',
    swatch: '#334155',
    bg: '#050810',
    surface: 'rgba(30,41,59,0.3)',
    border: 'rgba(51,65,85,0.45)',
    borderHover: 'rgba(100,116,139,0.65)',
    text: '#f8fafc',
    muted: '#94a3b8',
    subtle: '#64748b',
    input: 'rgba(30,41,59,0.55)',
    header: 'rgba(5,8,16,0.96)',
    tableHead: '#080c1a',
    rowEven: 'rgba(15,23,42,0.3)',
    rowHover: 'rgba(30,41,59,0.55)',
    modal: '#0a1020',
    dropdown: '#0d1428',
    accent: '#94a3b8',
  },
  {
    id: 'deserto',
    name: 'Deserto',
    swatch: '#92400e',
    bg: '#0c0800',
    surface: 'rgba(120,53,15,0.18)',
    border: 'rgba(146,64,14,0.4)',
    borderHover: 'rgba(245,158,11,0.45)',
    text: '#fffbeb',
    muted: '#fcd34d',
    subtle: '#d97706',
    input: 'rgba(120,53,15,0.22)',
    header: 'rgba(12,8,0,0.96)',
    tableHead: '#150d00',
    rowEven: 'rgba(120,53,15,0.1)',
    rowHover: 'rgba(120,53,15,0.28)',
    modal: '#1a1000',
    dropdown: '#1f1400',
    accent: '#f59e0b',
  },
];
