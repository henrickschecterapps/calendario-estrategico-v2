"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle, Plus, Trash2, Package, Shirt } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { InventoryItem } from "@/types/collections";

interface PedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: InventoryItem | null;
  onSaved: () => void;
}

export default function PedidoModal({ isOpen, onClose, itemToEdit, onSaved }: PedidoModalProps) {
  const [categoria, setCategoria] = useState<'brinde' | 'uniforme'>('brinde');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [nivel, setNivel] = useState('Massa');
  const [tamanhos, setTamanhos] = useState<{ tamanho: string, quantidade: number }[]>([]);
  const [qtdTotal, setQtdTotal] = useState(0);
  const [preco, setPreco] = useState('0,00');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form sync
  useEffect(() => {
    if (itemToEdit) {
      const isUniforme = itemToEdit.tipo === 'uniforme';
      setCategoria(isUniforme ? 'uniforme' : 'brinde');
      setNome(itemToEdit.nome || '');
      setDescricao(itemToEdit.descricao || '');
      setNivel(itemToEdit.nivel || 'Massa');
      setTamanhos(itemToEdit.tamanhos || []);
      setQtdTotal(itemToEdit.quantidade || 0);
      setPreco(itemToEdit.preco?.toString() || '0,00');
    } else {
      setCategoria('brinde');
      setNome('');
      setDescricao('');
      setNivel('Massa');
      setTamanhos([]);
      setQtdTotal(0);
      setPreco('0,00');
    }
  }, [itemToEdit, isOpen]);

  // Recalculate Qtd Total when tamanhos change
  useEffect(() => {
    if (categoria === 'uniforme') {
      const sum = tamanhos.reduce((acc, t) => acc + (Number(t.quantidade) || 0), 0);
      setQtdTotal(sum);
    }
  }, [tamanhos, categoria]);

  const valorTotal = (Number(qtdTotal) || 0) * (typeof preco === 'string' ? parseFloat(preco.replace(',', '.')) : Number(preco));

  const addTamanho = () => {
    setTamanhos([...tamanhos, { tamanho: 'M', quantidade: 1 }]);
  };

  const removeTamanho = (index: number) => {
    setTamanhos(tamanhos.filter((_, i) => i !== index));
  };

  const updateTamanho = (index: number, field: 'tamanho' | 'quantidade', val: string | number) => {
    const newT = [...tamanhos];
    newT[index] = { ...newT[index], [field]: val };
    setTamanhos(newT);
  };

  const handleSave = async () => {
    setError('');
    if (!nome.trim()) {
      setError("O nome do item é obrigatório.");
      return;
    }
    if (categoria === 'uniforme' && tamanhos.length === 0) {
      setError("Adicione ao menos um tamanho para o uniforme.");
      return;
    }

    setSaving(true);
    try {
      const db = getFirebaseDb();
      // Salva na coleção 'pedidos' para unificar brindes e uniformes sendo pedidos.
      // E setamos o `tipo` internamente para saber o que é.
      const payload = {
        _collection: 'pedidos',
        tipo: categoria,
        nome,
        descricao,
        quantidade: qtdTotal,
        preco,
        status: itemToEdit?.status || 'Cotacao', // Mantém status se editando, ou Cotação
        nivel: categoria === 'brinde' ? nivel : null,
        tamanhos: categoria === 'uniforme' ? tamanhos : null,
        updatedAt: serverTimestamp()
      };

      if (itemToEdit?.id) {
        await setDoc(doc(db, 'pedidos', itemToEdit.id), payload, { merge: true });
      } else {
        await addDoc(collection(db, 'pedidos'), { ...payload, createdAt: serverTimestamp() });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar o pedido.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative bg-surface w-full max-w-xl h-full shadow-2xl flex flex-col transform transition-transform duration-500 border-l border-white/5 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-surface">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-accent/10 text-accent rounded-xl"><Package className="w-5 h-5" /></div>
             <h2 className="text-xl font-bold text-text tracking-tight">
               {itemToEdit ? "Editar Pedido" : "Novo Pedido de Compra"}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted hover:text-text">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-red/10 text-red p-4 rounded-xl flex items-center gap-3 text-sm font-medium border border-red/20">
              <AlertCircle className="w-5 h-5 shrink-0"/> {error}
            </div>
          )}

          {/* Tipo Selector */}
          <div className="grid grid-cols-2 gap-4">
             <button
                onClick={() => setCategoria('brinde')}
                className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all", categoria === 'brinde' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface/50 border-white/5 text-muted hover:bg-white/5 hover:text-text')}
             >
                <Package className="w-6 h-6" />
                <span className="font-semibold tracking-tight">Brinde</span>
             </button>
             <button
                onClick={() => setCategoria('uniforme')}
                className={cn("p-4 rounded-xl border flex flex-col items-center gap-2 transition-all", categoria === 'uniforme' ? 'bg-purple/10 border-purple/30 text-purple' : 'bg-surface/50 border-white/5 text-muted hover:bg-white/5 hover:text-text')}
             >
                <Shirt className="w-6 h-6" />
                <span className="font-semibold tracking-tight">Uniforme</span>
             </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">Nome do Item</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-bg/50 border border-white/5 p-3 rounded-lg text-text focus:border-accent outline-none transition-colors" placeholder="Ex: Mochila Executiva" />
            </div>

            {categoria === 'brinde' && (
              <div>
                <label className="block text-xs font-mono text-muted uppercase mb-1">Nível</label>
                <select value={nivel} onChange={e => setNivel(e.target.value)} className="w-full bg-bg/50 border border-white/5 p-3 rounded-lg text-text focus:border-accent outline-none transition-colors appearance-none">
                  <option value="Massa">Massa</option>
                  <option value="Qualificação">Qualificação</option>
                  <option value="VIP">VIP</option>
                  <option value="Sorteio">Sorteio</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">Detalhes (Descrição)</label>
              <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} className="w-full bg-bg/50 border border-white/5 p-3 rounded-lg text-text focus:border-accent outline-none transition-colors resize-none" placeholder="Especificações do item..."></textarea>
            </div>

            {categoria === 'uniforme' && (
              <div className="bg-bg/30 p-4 rounded-xl border border-white/5 space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-muted uppercase">Tamanhos e Quantidades</label>
                    <button onClick={addTamanho} className="text-xs font-semibold text-accent hover:text-accent/80 flex items-center gap-1"><Plus className="w-3 h-3"/> Adicionar Tamanho</button>
                 </div>
                 {tamanhos.map((t, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                       <select value={t.tamanho} onChange={(e) => updateTamanho(idx, 'tamanho', e.target.value)} className="flex-1 bg-surface border border-white/5 p-2 rounded-lg text-sm text-text focus:border-purple outline-none appearance-none">
                          <option value="P">P</option>
                          <option value="M">M</option>
                          <option value="G">G</option>
                          <option value="GG">GG</option>
                          <option value="XG">XG</option>
                          <option value="Baby Look P">Baby Look P</option>
                          <option value="Baby Look M">Baby Look M</option>
                          <option value="Baby Look G">Baby Look G</option>
                          <option value="Baby Look GG">Baby Look GG</option>
                       </select>
                       <input type="number" min="1" value={t.quantidade} onChange={(e) => updateTamanho(idx, 'quantidade', parseInt(e.target.value) || 0)} className="w-24 bg-surface border border-white/5 p-2 rounded-lg text-sm text-center text-text focus:border-purple outline-none" />
                       <button onClick={() => removeTamanho(idx)} className="p-2 text-muted hover:text-red hover:bg-red/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                 ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-mono text-muted uppercase mb-1">Quantidade Total</label>
                  <input type="number" value={qtdTotal} onChange={e => setQtdTotal(parseInt(e.target.value) || 0)} disabled={categoria === 'uniforme'} className={cn("w-full bg-bg/50 border border-white/5 p-3 rounded-lg text-text focus:border-accent outline-none transition-colors", categoria === 'uniforme' && 'opacity-50 cursor-not-allowed')} />
               </div>
               <div>
                  <label className="block text-xs font-mono text-muted uppercase mb-1">Preço Unitário (R$)</label>
                  <input type="text" value={preco} onChange={e => setPreco(e.target.value)} className="w-full bg-bg/50 border border-white/5 p-3 rounded-lg text-text focus:border-accent outline-none transition-colors" />
               </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 p-4 rounded-xl flex items-center justify-between">
               <span className="text-sm font-semibold text-text">Valor Total do Pedido:</span>
               <span className="text-xl font-black text-accent">
                 R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </span>
            </div>

          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-surface flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg font-medium text-text hover:bg-white/5 transition-all text-sm">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/80 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 text-sm disabled:opacity-50">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-5 h-5"/>}
            Salvar Pedido
          </button>
        </div>

      </div>
    </div>
  );
}
