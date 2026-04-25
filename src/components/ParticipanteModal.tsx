"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

interface ParticipanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: any | null;
  onSaved: () => void;
}

export default function ParticipanteModal({ isOpen, onClose, itemToEdit, onSaved }: ParticipanteModalProps) {
  const [formData, setFormData] = useState<any>({
    nome: '',
    email: '',
    telefone: '',
    funcao: '',
    tamanho: 'M'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setFormData(itemToEdit);
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        funcao: '',
        tamanho: 'M'
      });
    }
    setError('');
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.nome) {
       setError("Nome é obrigatório.");
       return;
    }
    setSaving(true);
    try {
      const db = getFirebaseDb();
      const payload = { ...formData, updatedAt: serverTimestamp() };

      if (itemToEdit?.id) {
        await setDoc(doc(db, "participantes", itemToEdit.id), payload, { merge: true });
      } else {
        await addDoc(collection(db, "participantes"), { ...payload, createdAt: serverTimestamp() });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o participante.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" onClick={onClose} />
      <div className="relative bg-surface w-full max-w-lg rounded-[32px] shadow-[0_40px_100px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border border-border">
        <div className="flex items-center justify-between p-8 border-b border-border bg-surface">
          <h2 className="text-2xl font-black text-text tracking-tight">
            {itemToEdit ? "Editar Participante" : "Novo Participante"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] bg-bg/30">
          {error && (
            <div className="bg-red/10 text-red p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red/20">
              <AlertCircle className="w-5 h-5"/> {error}
            </div>
          )}

          <div>
             <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Nome Completo *</label>
             <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-surface text-text text-base px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none font-bold transition-all" placeholder="Nome do integrante..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">E-mail</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-surface text-text text-sm px-5 py-3.5 rounded-2xl border border-border focus:border-accent outline-none font-medium transition-all" placeholder="email@exemplo.com" />
             </div>
             <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Telefone</label>
                <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full bg-surface text-text text-sm px-5 py-3.5 rounded-2xl border border-border focus:border-accent outline-none font-medium transition-all" placeholder="(00) 00000-0000" />
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Função Padrão</label>
                <input type="text" name="funcao" value={formData.funcao} onChange={handleChange} placeholder="Ex: Staff, Fotógrafo" className="w-full bg-surface text-text text-sm px-5 py-3.5 rounded-2xl border border-border focus:border-accent outline-none font-medium transition-all" />
             </div>
             <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Tam. Camisa</label>
                <select name="tamanho" value={formData.tamanho} onChange={handleChange} className="w-full bg-surface text-text text-sm font-bold px-5 py-3.5 rounded-2xl border border-border focus:border-accent outline-none transition-all cursor-pointer">
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
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-4 flex-shrink-0">
          <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-muted hover:bg-muted/10 rounded-2xl transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-10 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-black rounded-2xl shadow-lg shadow-accent/20 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4"/>}
            {saving ? 'Salvando...' : 'Salvar Participante'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";
