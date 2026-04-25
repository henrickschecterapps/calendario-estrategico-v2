export interface TriplaEvent {
  id: string;
  evento: string;
  data_ini: string; // Ex: 'dd/mm/aaaa'
  data_fim: string; // Ex: 'dd/mm/aaaa'
  responsavel: string;
  status: 'Planejado' | 'Confirmado' | 'Concluído' | string;
  tipo: 'Comercial Interno' | 'Comercial Patrocinado' | 'Interno' | 'Feriado' | string;
  formato: string;
  descricao?: string;
  // Outros campos flexíveis
  [key: string]: any;
}
