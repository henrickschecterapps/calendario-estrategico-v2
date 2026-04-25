"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle, Loader2 } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEvents } from "@/store/useEvents";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'brinde' | 'uniforme' | 'almoxarifado' | 'fornecedor';
  itemToEdit?: any | null;
  onSaved: () => void;
}

export default function InventoryModal({ isOpen, onClose, tipo, itemToEdit, onSaved }: InventoryModalProps) {
  const [formData, setFormData] = useState<any>({
    nome: '',
    descricao: '',
    quantidade: 0,
    preco: '0,00',
    status: 'Cotacao', // For Kanban
    email: '', // for Fornecedores
    telefone: '', // for Fornecedores
    contato_responsavel: '', // for Fornecedores
    evento_id: '' // Link to event
  });

  const { events, fetchEvents } = useEvents();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        nome: itemToEdit.nome || '',
        descricao: itemToEdit.descricao || '',
        quantidade: itemToEdit.quantidade || 0,
        preco: itemToEdit.preco || '0,00',
        status: itemToEdit.status || (tipo === 'uniforme' ? 'Pedido' : 'Cotacao'),
        email: itemToEdit.email || '',
        telefone: itemToEdit.telefone || '',
        contato_responsavel: itemToEdit.contato_responsavel || '',
        evento_id: itemToEdit.evento_id || '',
        id: itemToEdit.id
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        quantidade: 0,
        preco: '0,00',
        status: tipo === 'uniforme' ? 'Pedido' : 'Cotacao',
        email: '',
        telefone: '',
        contato_responsavel: '',
        evento_id: ''
      });
    }
    if (events.length === 0) fetchEvents();
    setError('');
  }, [itemToEdit, isOpen, tipo]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.nome) {
       setError("O nome é obrigatório.");
       return;
    }
    setSaving(true);
    try {
      const db = getFirebaseDb();
      const colName = tipo === 'fornecedor' ? 'fornecedores' : 'inventario';
      
      const payload = {
         ...formData,
         tipo,
         updatedAt: serverTimestamp()
      };

      if (itemToEdit?.id) {
        await setDoc(doc(db, colName, itemToEdit.id), payload, { merge: true });
      } else {
        await addDoc(collection(db, colName), { ...payload, createdAt: serverTimestamp() });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar o item.');
    } finally {
      setSaving(false);
    }
  };

  const isFornecedor = tipo === 'fornecedor';
  const displayTitle = itemToEdit 
    ? "Editar " + (isFornecedor ? "Fornecedor" : tipo)
    : "Novo " + (isFornecedor ? "Fornecedor" : tipo);

  return (
    <div className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      
      {/* Side Drawer Content */}
      <div className={`relative bg-surface w-full max-w-lg h-full shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-col transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border-l border-border ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-8 border-b border-border bg-surface">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-accent/10 text-accent rounded-2xl"><AlertCircle className="w-6 h-6" /></div>
             <h2 className="text-2xl font-black capitalize text-text tracking-tight">
               {displayTitle}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted">
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-bg/50 custom-scrollbar">
          {error && (
            <div className="bg-red/10 text-red p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red/20 animate-in fade-in zoom-in-95">
              <AlertCircle className="w-5 h-5 shrink-0"/> {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-surface p-6 rounded-[24px] border border-border shadow-sm space-y-5">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Informações Básicas</p>
              <div>
                 <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2 ml-1">
                   {isFornecedor ? 'Empresa Fornecedora' : 'Nome do Item'}
                 </label>
                 <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Mochila Executiva" className="w-full bg-bg text-text text-base px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none font-bold transition-all placeholder:text-muted/40" />
              </div>

              {!isFornecedor && (
                <div>
                   <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Detalhes / Variação</label>
                   <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Ex: Tamanho G, Cor Azul" className="w-full bg-bg text-text text-sm px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none font-medium transition-all placeholder:text-muted/40" />
                </div>
              )}
            </div>

            {isFornecedor && (
              <div className="bg-surface p-6 rounded-[24px] border border-border shadow-sm space-y-5">
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Contato Comercial</p>
                <div className="grid grid-cols-1 gap-5">
                   <div>
                      <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Contato Responsável</label>
                      <input type="text" name="contato_responsavel" value={formData.contato_responsavel} onChange={handleChange} placeholder="Ex: João da Silva" className="w-full bg-bg text-text text-sm px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all placeholder:text-muted/40" />
                   </div>
                   <div>
                      <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2 ml-1">E-mail para Pedidos</label>
                      <input type="text" name="email" value={formData.email} onChange={handleChange} placeholder="contato@empresa.com.br" className="w-full bg-bg text-text text-sm px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all placeholder:text-muted/40" />
                   </div>
                   <div>
                      <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Telefone / WhatsApp</label>
                      <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" className="w-full bg-bg text-text text-sm px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all placeholder:text-muted/40" />
                   </div>
                </div>
              </div>
            )}

            {!isFornecedor && (
               <div className="bg-surface p-6 rounded-[24px] border border-border shadow-sm space-y-6">
                 <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Controle e Custos</p>
                 <div className="grid grid-cols-2 gap-5">
                    <div>
                       <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Quantidade</label>
                       <input type="number" name="quantidade" value={formData.quantidade} onChange={handleChange} className="w-full bg-bg text-text text-2xl font-black px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all" />
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Preço Unitário</label>
                       <div className="relative">
                         <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-black">R$</span>
                         <input type="text" name="preco" value={formData.preco} onChange={handleChange} className="w-full bg-bg text-green text-2xl font-black pl-12 pr-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all" />
                       </div>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Status do Fluxo</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-bg text-text text-sm font-bold px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all cursor-pointer">
                       {tipo === 'uniforme' ? (
                          <>
                             <option value="Pedido">📦 Pedido (Aguardando)</option>
                             <option value="Em Producao">⚙️ Em Produção</option>
                             <option value="Entregue">✅ Entregue</option>
                             <option value="Cancelado">❌ Cancelado</option>
                          </>
                       ) : (
                          <>
                             <option value="Cotacao">🔍 Cotação</option>
                             <option value="Aprovado">🤝 Aprovado</option>
                             <option value="Pedido">📦 Pedido Realizado</option>
                             <option value="Recebido">🎯 Recebido / Estoque</option>
                          </>
                       )}
                    </select>
                 </div>
               </div>
            )}

            {!isFornecedor && (
              <div className="bg-surface p-6 rounded-[24px] border border-border shadow-sm space-y-5">
                 <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Alocação Estratégica</p>
                 <div>
                    <label className="block text-[11px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Vincular a um Evento</label>
                    <select name="evento_id" value={formData.evento_id} onChange={handleChange} className="w-full bg-bg text-text text-sm font-bold px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all cursor-pointer">
                       <option value="">🏠 Estoque Central (Sem Vínculo)</option>
                       {events.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.evento} — {ev.data_ini}</option>
                       ))}
                    </select>
                    <p className="mt-3 text-[11px] font-bold text-muted/60 italic leading-relaxed">Itens vinculados aparecem automaticamente no card do evento correspondente.</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-8 border-t border-border bg-surface flex flex-col gap-4">
          <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-accent hover:bg-accent-hover text-white text-base font-black rounded-2xl shadow-xl shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-50">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>}
            {saving ? 'PROCESSANDO...' : 'SALVAR ALTERAÇÕES'}
          </button>
          <button onClick={onClose} className="w-full py-3 text-sm font-black text-muted hover:text-text transition-colors tracking-widest">DESCARTAR E FECHAR</button>
        </div>

      </div>
    </div>
  );
}
