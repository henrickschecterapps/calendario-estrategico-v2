import type { EquipeMember, ClienteMember, VipMember, BrindeAlocado, HistoricoEntry, Comentario } from './collections';

export interface TriplaEvent {
  id: string;
  evento: string;
  data_ini: string; // Ex: 'dd/mm/aaaa' or 'yyyy-mm-dd'
  data_fim: string;
  responsavel: string;
  status: 'Planejado' | 'Confirmado' | 'Concluído' | string;
  tipo: 'Comercial Interno' | 'Comercial Patrocinado' | 'Interno' | 'Feriado' | string;
  formato: string;
  descricao?: string;

  // Campos operacionais
  hora_ini?: string;
  hora_fim?: string;
  cota?: string;
  localidade?: string;
  links?: string;
  publico?: string;
  participantes?: string;
  beneficios?: string;
  obs?: string;

  // Legacy/optional fields accessed by views
  cidade?: string;
  conteudo?: string;
  materiais?: string;
  
  // Financeiro Novo
  uf?: string;
  tipo_financeiro?: 'Happy Hour' | 'Segmento' | 'Regional' | 'Nacional' | string;
  apuracao_finalizada?: boolean;
  custo_real?: number | string;
  previsao_pipe?: number | string;
  previsao_fechamento?: number | string;
  receita_estimada?: number | string;

  // Financeiro Legado
  orcamento_total?: number | string;
  custo_brindes?: number | string;
  custo_uniformes?: number | string;
  custo_ingressos?: number | string;
  custo_passagens?: number | string;
  custo_hospedagem?: number | string;
  custo_outros?: number | string;
  outros_custos_lista?: { id: string; nome: string; descricao: string; valor: number | string }[];

  // Vagas
  vagas_staff?: number;
  vagas_cliente?: number;
  vagas_vip?: number;

  // Listas alocadas
  organizadores?: string[];
  equipe?: EquipeMember[];
  clientes?: ClienteMember[];
  vips?: VipMember[];
  brindes_alocados?: BrindeAlocado[];

  // Histórico e comentários (embedded)
  historico?: HistoricoEntry[];
  comentarios?: Comentario[];

  // Arquivos anexados
  arquivos?: { nome: string; url: string; tipo: string }[];

  // Campos dinâmicos do Firestore não mapeados explicitamente
  [key: string]: unknown;
}
