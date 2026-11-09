export const accessModules = [
  { key: 'GERAL', label: 'Geral' },
  { key: 'CADASTROS', label: 'Cadastros' },
  { key: 'ORDEM_SERVICO', label: 'Ordem de Serviço' },
  { key: 'FATURAMENTO', label: 'Faturamento' },
  { key: 'RELATORIOS', label: 'Relatórios' },
  { key: 'ADMINISTRACAO', label: 'Administração' },
] as const

export type TModule = (typeof accessModules)[number]['key']
export type TAccessLevel = 1 | 2 | 3
export type TModuleAccess = Record<TModule, TAccessLevel>
