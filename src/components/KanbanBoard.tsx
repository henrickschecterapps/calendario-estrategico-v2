"use client";

import { useState } from "react";
import { Package, Shirt, MoreHorizontal, Edit2, Trash2, Send, Clock, CheckCircle2, ShoppingCart, ArrowDownToLine, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/types/collections";

const KANBAN_COLUMNS = [
  { id: 'Cotacao', label: 'Cotação', icon: <Clock className="w-4 h-4" /> },
  { id: 'Aprovado', label: 'Aprovado', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'Pedido Realizado', label: 'Pedido Realizado', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'Recebido', label: 'Recebido', icon: <ArrowDownToLine className="w-4 h-4" /> }
];

interface KanbanBoardProps {
  items: InventoryItem[];
  viewMode: 'grid' | 'list';
  onEditItem: (item: InventoryItem) => void;
  onUpdateStatus: (id: string, newStatus: string, item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onSendToEstoque: (item: InventoryItem) => void;
}

export default function KanbanBoard({ items, viewMode, onEditItem, onUpdateStatus, onDelete, onSendToEstoque }: KanbanBoardProps) {
  
  if (viewMode === 'list') {
    return (
      <div className="bg-surface/30 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
             <thead>
               <tr className="border-b border-white/5 text-muted font-mono uppercase text-[11px] tracking-widest bg-surface/50">
                  <th className="py-4 px-5 font-medium">Item</th>
                  <th className="py-4 px-5 font-medium">Categoria</th>
                  <th className="py-4 px-5 font-medium">Qtd</th>
                  <th className="py-4 px-5 font-medium">Status</th>
                  <th className="py-4 px-5 font-medium">Valor</th>
                  <th className="py-4 px-5 text-right font-medium">Ações</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-muted">Nenhum pedido de compra localizado.</td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-all group">
                     <td className="py-4 px-5">
                        <div className="flex flex-col">
                           <span className="font-semibold text-text uppercase tracking-tight">{item.nome}</span>
                           <span className="text-[11px] text-muted truncate max-w-[200px]">{item.descricao || 'Sem descrição'}</span>
                        </div>
                     </td>
                     <td className="py-4 px-5">
                        <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold", item.tipo === 'brinde' ? "bg-accent/10 text-accent" : "bg-purple/10 text-purple")}>
                           {item.tipo === 'brinde' ? <Package className="w-3 h-3"/> : <Shirt className="w-3 h-3"/>}
                           <span className="capitalize">{item.tipo}</span>
                        </div>
                     </td>
                     <td className="py-4 px-5">
                        <span className="font-bold text-text">{item.quantidade || 0}</span>
                     </td>
                     <td className="py-4 px-5">
                        <select 
                           value={item.status || 'Cotacao'} 
                           onChange={(e) => onUpdateStatus(item.id!, e.target.value, item)}
                           className="bg-bg/50 border border-white/5 p-1.5 rounded text-xs text-text outline-none appearance-none cursor-pointer"
                        >
                           {KANBAN_COLUMNS.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                        </select>
                     </td>
                     <td className="py-4 px-5">
                        <span className="text-text font-medium">R$ {item.preco || '0,00'}</span>
                     </td>
                     <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {item.status === 'Recebido' && (
                             <button onClick={() => onSendToEstoque(item)} className="p-1.5 bg-green/10 text-green hover:bg-green/20 rounded-md transition-colors tooltip" title="Enviar para Estoque">
                               <Send className="w-4 h-4"/>
                             </button>
                           )}
                           <button onClick={() => onEditItem(item)} className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-md transition-colors"><Edit2 className="w-4 h-4"/></button>
                           <button onClick={() => onDelete(item.id!)} className="p-1.5 text-muted hover:text-red hover:bg-red/10 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Kanban View
  return (
    <div className="flex flex-1 gap-6 overflow-x-auto pb-4 custom-scrollbar items-start">
      {KANBAN_COLUMNS.map(col => {
        const colItems = items.filter(i => (i.status || 'Cotacao') === col.id);
        
        return (
          <div key={col.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
            {/* Column Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-white/5 rounded-md text-muted">{col.icon}</div>
                 <h3 className="font-semibold text-text uppercase tracking-wider text-sm">{col.label}</h3>
              </div>
              <span className="text-xs font-black text-muted bg-surface/50 px-2 py-0.5 rounded-full border border-white/5">
                 {colItems.length}
              </span>
            </div>

            {/* Column Body */}
            <div className="flex flex-col gap-3 min-h-[200px] bg-surface/30 border border-white/5 rounded-xl p-3">
              {colItems.map(item => (
                <div key={item.id} className="bg-surface hover:bg-surface/80 border border-white/5 hover:border-white/10 rounded-lg p-4 flex flex-col gap-3 transition-all group">
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", item.tipo === 'brinde' ? "bg-accent/10 text-accent" : "bg-purple/10 text-purple")}>
                       {item.tipo === 'brinde' ? <Package className="w-3 h-3"/> : <Shirt className="w-3 h-3"/>}
                       {item.tipo}
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                       <button onClick={() => onEditItem(item)} className="p-1 text-muted hover:text-accent rounded"><Edit2 className="w-3.5 h-3.5"/></button>
                       <button onClick={() => onDelete(item.id!)} className="p-1 text-muted hover:text-red rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>

                  <div>
                     <h4 className="font-bold text-text uppercase text-sm tracking-tight">{item.nome}</h4>
                     {item.descricao && <p className="text-xs text-muted mt-1 line-clamp-2">{item.descricao}</p>}
                  </div>

                  {item.tamanhos && item.tamanhos.length > 0 && (
                     <div className="flex flex-wrap gap-1">
                       {item.tamanhos.map((t, idx) => (
                          <span key={idx} className="text-[10px] font-mono bg-bg/50 border border-white/5 px-1.5 py-0.5 rounded text-muted">
                            {t.tamanho}: <strong className="text-text">{t.quantidade}</strong>
                          </span>
                       ))}
                     </div>
                  )}

                  <div className="flex items-end justify-between pt-3 border-t border-white/5">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[10px] text-muted font-mono uppercase tracking-widest">Quantidade</span>
                       <span className="font-bold text-text">{item.quantidade || 0} un.</span>
                     </div>
                     
                     <div className="flex flex-col items-end gap-0.5">
                       {item.status === 'Recebido' ? (
                         <button onClick={() => onSendToEstoque(item)} className="bg-green hover:bg-green/80 text-black font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition-all">
                           <Send className="w-3.5 h-3.5"/>
                           P/ Estoque
                         </button>
                       ) : (
                         <select 
                            value={item.status || 'Cotacao'} 
                            onChange={(e) => onUpdateStatus(item.id!, e.target.value, item)}
                            className="bg-bg border border-white/5 px-2 py-1 rounded text-[11px] font-medium text-text outline-none appearance-none cursor-pointer hover:border-white/10 transition-colors"
                         >
                            {KANBAN_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                         </select>
                       )}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
