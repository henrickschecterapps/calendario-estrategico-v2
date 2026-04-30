import type { FieldValue } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// Firestore Collection Types — Tripla Eventos v2.0
// ═══════════════════════════════════════════════════════════════

/** Firestore Timestamp representation (serialized from Firestore SDK) */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

// ─── Inventário (multi-collection: inventario, brindes, uniformes, estoque) ───

export type InventoryType = 'brinde' | 'uniforme' | 'estoque';
export type InventoryCollection = 'inventario' | 'brindes' | 'uniformes' | 'estoque' | 'pedidos';

export type BrindeStatus = 'Cotacao' | 'Aprovado' | 'Pedido' | 'Recebido';
export type UniformeStatus = 'Pedido' | 'Em Producao' | 'Entregue' | 'Cancelado';

export interface InventoryItem {
  id: string;
  _collection: InventoryCollection;
  nome: string;
  descricao?: string;
  quantidade: number;
  preco?: string | number;
  status?: string;
  tipo?: InventoryType;
  vip?: boolean;
  nivel?: string;
  fornecedor?: string;
  evento_id?: string;
  tamanhos?: { tamanho: string; quantidade: number }[];
  createdAt?: FieldValue | FirestoreTimestamp;
  updatedAt?: FieldValue | FirestoreTimestamp;
}

export interface InventoryFormData {
  id?: string;
  nome: string;
  descricao: string;
  quantidade: number;
  preco: string;
  status: string;
  email: string;
  telefone: string;
  contato_responsavel: string;
  evento_id: string;
  nivel: string;
  fornecedor: string;
  vip: boolean;
}

// ─── Fornecedores ────────────────────────────────────────────

export interface Fornecedor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  contato_responsavel?: string;
  createdAt?: FieldValue | FirestoreTimestamp;
  updatedAt?: FieldValue | FirestoreTimestamp;
}

// ─── Viagens ─────────────────────────────────────────────────

export type ViagemStatus = 'Pendente' | 'Emitido' | 'Cancelado';

export interface ViagemArquivo {
  nome: string;
  url: string;
  tipo: string;
  data: string;
}

export interface Viagem {
  id: string;
  trecho: string;
  passageiro: string;
  status: ViagemStatus | string;
  localizador?: string;
  valor?: string;
  arquivos?: ViagemArquivo[];
  createdAt?: FieldValue | FirestoreTimestamp;
  updatedAt?: FieldValue | FirestoreTimestamp;
}

export interface ViagemFormData {
  trecho: string;
  passageiro: string;
  status: string;
  localizador: string;
  valor: string;
  arquivos: ViagemArquivo[];
}

// ─── Participantes ───────────────────────────────────────────

export type TamanhoCamisa = 'P' | 'M' | 'G' | 'GG' | 'XG' | 'Baby Look P' | 'Baby Look M' | 'Baby Look G' | 'Baby Look GG';

export interface Participante {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  funcao?: string;
  tamanho?: TamanhoCamisa | string;
  createdAt?: FieldValue | FirestoreTimestamp;
  updatedAt?: FieldValue | FirestoreTimestamp;
}

export interface ParticipanteFormData {
  nome: string;
  email: string;
  telefone: string;
  funcao: string;
  tamanho: string;
}

// ─── Comentários (embedded in evento doc) ────────────────────

export interface Comentario {
  id: string;
  autor: string;
  texto: string;
  data: string;
  editado?: boolean;
}

// ─── Histórico de Atividades (embedded in evento doc) ────────

export interface HistoricoEntry {
  acao: string;
  editor: string;
  data: string;
}

// ─── Membros alocados em eventos ─────────────────────────────

export interface EquipeMember {
  nome: string;
  funcao: string;
  tamanho: string;
}

export interface ClienteMember {
  nome: string;
  empresa: string;
}

export interface VipMember {
  nome: string;
  obs: string;
}

export interface BrindeAlocado {
  id?: string;
  docId?: string;
  item: string;
  qtd: number;
}

// ─── EventFormData (formulário de criação/edição) ────────────

export interface EventFormData {
  evento: string;
  data_ini: string;
  data_fim: string;
  hora_ini: string;
  hora_fim: string;
  responsavel: string;
  tipo: string;
  status: string;
  formato: string;
  cota: string;
  localidade: string;
  links: string;
  organizadores: string[];
  vagas_staff: number;
  vagas_cliente: number;
  vagas_vip: number;
  equipe: EquipeMember[];
  clientes: ClienteMember[];
  vips: VipMember[];
  brindes_alocados: BrindeAlocado[];
  publico: string;
  participantes: string;
  beneficios: string;
  obs: string;
  descricao?: string;
  conteudo?: string;
  arquivos: { nome: string; url: string; tipo: string }[];
  historico: HistoricoEntry[];
  [key: string]: unknown;
}

// ─── Event History (subcollection: eventos/{id}/history) ─────

export interface EventHistoryEntry {
  id: string;
  action: string;
  author: string;
  author_email: string;
  timestamp: FirestoreTimestamp | null;
  summary: string;
}

// ─── Configurações (users & responsaveis) ────────────────────

export type UserRole = 'admin' | 'approved' | 'pending';

export interface AppUser {
  id: string;
  email?: string;
  nome?: string;
  role: UserRole | string;
  createdAt?: FieldValue | FirestoreTimestamp;
}

/** @deprecated Use AppUser instead */
export type PendingUser = AppUser;

export interface Organizador {
  id: string;
  nome: string;
}

// ─── Activity Log (derived from HistoricoEntry + TriplaEvent) ─

export interface ActivityEntry extends HistoricoEntry {
  eventRef: import('./evento').TriplaEvent;
  timestamp: number;
}
