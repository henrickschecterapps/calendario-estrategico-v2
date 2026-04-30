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
  brinde?: string;

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
