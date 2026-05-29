function escape(v: unknown): string {
  const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) return '(sem dados)\n';
  const keys = Object.keys(rows[0]).filter(k => k !== 'id');
  return [
    keys.join(','),
    ...rows.map(r => keys.map(k => escape(r[k])).join(',')),
  ].join('\n') + '\n';
}

function readRows(key: string): Record<string, unknown>[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const MODULES = [
  { label: 'EFETIVO',                             key: 'cpe-site:efetivo:v1' },
  { label: 'ANIVERSARIANTES',                     key: 'cpe-site:aniversariantes:v1' },
  { label: 'PLANO DE CHAMADA',                    key: 'cpe-site:plano-chamada:v1' },
  { label: 'AGENDA DE AUDIÊNCIAS',                key: 'cpe-site:agenda-audiencias:v1' },
  { label: 'DISPENSA RECOMPENSA — CMDO',          key: 'cpe-site:dispensa-recompensa:cmdo:v1' },
  { label: 'DISPENSA RECOMPENSA — ANUAL',         key: 'cpe-site:dispensa-recompensa:anual:v1' },
  { label: 'PLANO DE FÉRIAS — SUBMODULOS',        key: 'cpe-site:plano-ferias:submodulos:v1' },
  { label: 'PLANO DE FÉRIAS — REGISTROS',         key: 'cpe-site:plano-ferias:submodulo-registros:v1' },
  { label: 'PLANO DE FÉRIAS — PENDENTES',         key: 'cpe-site:plano-ferias:pendentes:v1' },
  { label: 'PLANO DE FÉRIAS — MENSAL',            key: 'cpe-site:plano-ferias:mensal:v1' },
  { label: 'PLANO DE FÉRIAS — ABRIL/MAIO',        key: 'cpe-site:plano-ferias:abr-mai:v1' },
  { label: 'ENTRADA / SAÍDA DE FÉRIAS',           key: 'cpe-site:entrada-saida-ferias:v2' },
  { label: 'MAPA DO EFETIVO',                     key: 'cpe-site:mapa-efetivo:v1' },
  { label: 'ARMAMENTO',                           key: 'cpe-site:armamento:v1' },
  { label: 'VIATURAS',                            key: 'cpe-site:viaturas:v1' },
  { label: 'CARÁTER GERAL — DIÁRIO',              key: 'cpe-site:carater-geral:v2' },
  { label: 'CARÁTER GERAL — HIST. VEÍCULOS',     key: 'cpe-site:carater-historico-veiculos:v1' },
  { label: 'CARÁTER GERAL — ALERTAS HISTÓRICOS', key: 'cpe-site:carater-alertas-historico:v1' },
];

export function downloadBackup() {
  const sep = '='.repeat(60);
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const parts: string[] = [`BACKUP CPE ANÁPOLIS — ${ts}\n\n`];

  for (const mod of MODULES) {
    const rows = readRows(mod.key);
    parts.push(`${sep}\n${mod.label}\n${sep}\n`);
    parts.push(toCsv(rows));
    parts.push('\n');
  }

  const blob = new Blob([parts.join('')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-cpe-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
