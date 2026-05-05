"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, ArrowRight, Package, Shirt, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TriplaEvent } from "@/types/evento";
import type { BrindeAlocado } from "@/types/collections";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

interface BaixaEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TriplaEvent;
  onSuccess: () => void;
}

export default function BaixaEstoqueModal({ isOpen, onClose, event, onSuccess }: BaixaEstoqueModalProps) {
  const [items, setItems] = useState<BrindeAlocado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && event.brindes_alocados) {
      // Initialize with default values if not present
      const initialItems = event.brindes_alocados.map(item => ({
        ...item,
        qtd_consumida: item.qtd_consumida ?? item.qtd,
        qtd_retornada: item.qtd_retornada ?? 0,
      }));
      setItems(initialItems);
    }
  }, [isOpen, event]);

  const handleUpdateItem = (index: number, field: 'qtd_consumida' | 'qtd_retornada', value: number) => {
    const newItems = [...items];
    const item = newItems[index];
    
    if (field === 'qtd_consumida') {
      const val = Math.max(0, Math.min(item.qtd, value));
      item.qtd_consumida = val;
      item.qtd_retornada = item.qtd - val;
    } else {
      const val = Math.max(0, Math.min(item.qtd, value));
      item.qtd_retornada = val;
      item.qtd_consumida = item.qtd - val;
    }
    
    setItems(newItems);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getFirebaseDb();
      
      // 1. Update the event with confirmed values
      const eventRef = doc(db, "eventos", event.id);
      const updatedBrindes = items.map(it => ({
        ...it,
        baixa_confirmada: true
      }));
      
      await updateDoc(eventRef, {
        brindes_alocados: updatedBrindes,
        estoque_baixa_processada: true,
        updatedAt: serverTimestamp()
      });

      // 2. Return items to stock
      for (const item of items) {
        if (item.docId && (item.qtd_retornada || 0) > 0) {
          const itemRef = doc(db, "estoque", item.docId);
          await updateDoc(itemRef, {
            quantidade: increment(item.qtd_retornada || 0),
            updatedAt: serverTimestamp()
          }).catch(e => console.error(`Erro ao devolver item ${item.item} ao estoque:`, e));
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Erro ao processar baixa de estoque. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent ring-1 ring-accent/30">
              <RefreshCw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text tracking-tight">Finalizar Inventário do Evento</h3>
              <p className="text-sm font-mono text-muted uppercase tracking-widest mt-0.5">{event.evento}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-text transition-colors bg-white/5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="mb-6 p-4 bg-amber/10 border border-amber/20 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <p className="text-sm text-amber/90 font-medium">
              Confirme a utilização dos itens abaixo. Itens marcados como <b>retornados</b> serão adicionados de volta ao Estoque Central automaticamente.
            </p>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-white/10 transition-all">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                   <div className="w-10 h-10 rounded-lg bg-bg/50 border border-white/5 flex items-center justify-center text-muted">
                      {item.item.toLowerCase().includes('camisa') || item.item.toLowerCase().includes('uniforme') ? <Shirt className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                   </div>
                   <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-text truncate uppercase">{item.item}</span>
                      <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Alocado: {item.qtd} un.</span>
                   </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-red/60 uppercase tracking-widest text-center">Consumido</label>
                      <div className="flex items-center gap-2 bg-red/5 border border-red/20 rounded-lg p-1">
                         <button onClick={() => handleUpdateItem(idx, 'qtd_consumida', (item.qtd_consumida || 0) - 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-muted hover:text-red transition-all">-</button>
                         <input 
                           type="number" 
                           value={item.qtd_consumida} 
                           onChange={(e) => handleUpdateItem(idx, 'qtd_consumida', parseInt(e.target.value) || 0)}
                           className="w-10 bg-transparent text-center text-sm font-bold text-text outline-none"
                         />
                         <button onClick={() => handleUpdateItem(idx, 'qtd_consumida', (item.qtd_consumida || 0) + 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-muted hover:text-red transition-all">+</button>
                      </div>
                   </div>

                   <ArrowRight className="w-4 h-4 text-muted/30 hidden md:block mt-4" />

                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-green/60 uppercase tracking-widest text-center">Retorno</label>
                      <div className="flex items-center gap-2 bg-green/5 border border-green/20 rounded-lg p-1">
                         <button onClick={() => handleUpdateItem(idx, 'qtd_retornada', (item.qtd_retornada || 0) - 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-muted hover:text-green transition-all">-</button>
                         <input 
                           type="number" 
                           value={item.qtd_retornada} 
                           onChange={(e) => handleUpdateItem(idx, 'qtd_retornada', parseInt(e.target.value) || 0)}
                           className="w-10 bg-transparent text-center text-sm font-bold text-text outline-none"
                         />
                         <button onClick={() => handleUpdateItem(idx, 'qtd_retornada', (item.qtd_retornada || 0) + 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-muted hover:text-green transition-all">+</button>
                      </div>
                   </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="py-10 text-center flex flex-col items-center gap-3">
                 <Package className="w-12 h-12 text-muted opacity-20" />
                 <p className="text-muted font-mono uppercase tracking-widest text-sm">Nenhum item alocado para este evento.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-muted hover:text-text transition-all">
            Cancelar
          </button>
          
          <div className="flex items-center gap-4">
            {error && <span className="text-xs text-red font-medium">{error}</span>}
            <button 
              onClick={handleConfirm}
              disabled={loading || items.length === 0}
              className="px-8 py-2.5 bg-accent text-white font-bold rounded-xl text-sm hover:bg-accent/80 transition-all flex items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirmar Baixa e Devolução
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
