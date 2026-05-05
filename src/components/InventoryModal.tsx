"use client";

import { useState, useEffect } from "react";
import { X, Save, Package, Shirt, Loader2, Info, LayoutGrid, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { InventoryItem, InventoryType } from "@/types/collections";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: InventoryItem | null;
  onSuccess: () => void;
}

export default function InventoryModal({ isOpen, onClose, editingItem, onSuccess }: InventoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo: "brinde" as InventoryType,
    quantidade: 0,
    preco: "0,00",
    nivel: "Qualificacao",
    fornecedor: "",
    tamanhos: [] as { tamanho: string; quantidade: number }[]
  });

  const tamanhosPadrao = ["P", "M", "G", "GG", "XG", "Baby Look P", "Baby Look M", "Baby Look G"];

  useEffect(() => {
    if (editingItem) {
      setFormData({
        nome: editingItem.nome || "",
        descricao: editingItem.descricao || "",
        tipo: editingItem.tipo || "brinde",
        quantidade: editingItem.quantidade || 0,
        preco: String(editingItem.preco || "0,00"),
        nivel: editingItem.nivel || "Qualificacao",
        fornecedor: editingItem.fornecedor || "",
        tamanhos: editingItem.tamanhos || []
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        tipo: "brinde",
        quantidade: 0,
        preco: "0,00",
        nivel: "Qualificacao",
        fornecedor: "",
        tamanhos: []
      });
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const payload = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (editingItem) {
        await updateDoc(doc(db, editingItem._collection || "estoque", editingItem.id), payload);
      } else {
        await addDoc(collection(db, "estoque"), {
          ...payload,
          createdAt: serverTimestamp(),
          _collection: "estoque"
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar item.");
    } finally {
      setLoading(false);
    }
  };

  const handleTamanhoChange = (tam: string, qtd: number) => {
    const currentTamanhos = [...formData.tamanhos];
    const index = currentTamanhos.findIndex(t => t.tamanho === tam);
    
    if (index >= 0) {
      currentTamanhos[index].quantidade = Math.max(0, qtd);
    } else {
      currentTamanhos.push({ tamanho: tam, quantidade: Math.max(0, qtd) });
    }
    
    const totalQtd = currentTamanhos.reduce((acc, t) => acc + t.quantidade, 0);
    setFormData({ ...formData, tamanhos: currentTamanhos, quantidade: totalQtd });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent ring-1 ring-accent/30">
              {formData.tipo === 'brinde' ? <Package className="w-6 h-6" /> : <Shirt className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-text tracking-tight">
                {editingItem ? 'Editar Registro' : 'Novo Cadastro de Item'}
              </h3>
              <p className="text-sm font-mono text-muted uppercase tracking-widest mt-0.5">Gestão de Inventário Inteligente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-text transition-colors bg-white/5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
            
            {/* TYPE TOGGLE */}
            <div className="flex flex-col gap-3">
               <label className="text-xs font-black text-muted uppercase tracking-[0.2em]">Categoria do Item</label>
               <div className="grid grid-cols-3 gap-2 bg-bg/50 p-1.5 rounded-xl border border-white/5">
                  {[
                    { id: 'brinde', label: 'Brinde', icon: <Package className="w-4 h-4"/> },
                    { id: 'uniforme', label: 'Uniforme', icon: <Shirt className="w-4 h-4"/> },
                    { id: 'estoque', label: 'Insumo', icon: <LayoutGrid className="w-4 h-4"/> }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo: t.id as any })}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                        formData.tipo === t.id 
                          ? "bg-accent text-white shadow-lg shadow-accent/20" 
                          : "text-muted hover:text-text hover:bg-white/5"
                      )}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-muted uppercase tracking-widest mb-1.5 block">Nome do Item</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Garrafa Térmica 500ml"
                    className="w-full bg-bg/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-text outline-none focus:border-accent/50 transition-all placeholder:text-muted/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-muted uppercase tracking-widest mb-1.5 block">Descrição Técnica</label>
                  <textarea 
                    rows={3}
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Detalhes sobre o material, cor, etc..."
                    className="w-full bg-bg/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-text outline-none focus:border-accent/50 transition-all placeholder:text-muted/30 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-muted uppercase tracking-widest mb-1.5 block">Qtd. Total</label>
                    <input 
                      type="number" 
                      required
                      disabled={formData.tipo === 'uniforme'}
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
                      className="w-full bg-bg/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-text outline-none focus:border-accent/50 transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-muted uppercase tracking-widest mb-1.5 block">Vlr. Unitário (R$)</label>
                    <input 
                      type="text" 
                      value={formData.preco}
                      onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                      placeholder="0,00"
                      className="w-full bg-bg/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-bold text-emerald-400 outline-none focus:border-accent/50 transition-all"
                    />
                  </div>
                </div>

                {formData.tipo === 'brinde' && (
                  <div>
                    <label className="text-xs font-black text-muted uppercase tracking-widest mb-1.5 block">Nível / Prioridade</label>
                    <select 
                      value={formData.nivel}
                      onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                      className="w-full bg-bg/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-text outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Qualificacao">Qualificação</option>
                      <option value="VIP">VIP</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-black text-muted uppercase tracking-widest mb-1.5 block">Fornecedor / Origem</label>
                  <input 
                    type="text" 
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    placeholder="Empresa fornecedora"
                    className="w-full bg-bg/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-text outline-none focus:border-accent/50 transition-all placeholder:text-muted/30"
                  />
                </div>
              </div>
            </div>

            {/* UNIFORME SIZES GRID */}
            {formData.tipo === 'uniforme' && (
              <div className="bg-purple/5 border border-purple/10 rounded-2xl p-5 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <Shirt className="w-5 h-5 text-purple" />
                  <h4 className="text-sm font-black text-purple uppercase tracking-widest">Grade de Tamanhos</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {tamanhosPadrao.map((tam) => (
                    <div key={tam} className="flex flex-col gap-1.5">
                       <span className="text-[10px] font-mono text-muted uppercase text-center">{tam}</span>
                       <input 
                         type="number" 
                         value={formData.tamanhos.find(t => t.tamanho === tam)?.quantidade || 0}
                         onChange={(e) => handleTamanhoChange(tam, parseInt(e.target.value) || 0)}
                         className="w-full bg-surface border border-purple/20 rounded-lg py-2 text-center text-sm font-bold text-text outline-none focus:border-purple/50 transition-all"
                       />
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-purple/10 flex justify-between items-center">
                   <span className="text-xs font-mono text-muted uppercase">Total Automatizado:</span>
                   <span className="text-lg font-bold text-purple">{formData.quantidade} unidades</span>
                </div>
              </div>
            )}

            {/* INFO BOX */}
            <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl flex gap-3">
               <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
               <p className="text-xs text-muted leading-relaxed">
                 Ao salvar este item, ele ficará disponível no <b>Estoque Central</b> para alocação em qualquer evento futuro.
               </p>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-muted hover:text-text transition-all">
              Cancelar
            </button>
            
            <button 
              type="submit"
              disabled={loading || !formData.nome}
              className="px-8 py-2.5 bg-accent text-white font-bold rounded-xl text-sm hover:bg-accent/80 transition-all flex items-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingItem ? 'Salvar Alterações' : 'Cadastrar no Estoque'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
