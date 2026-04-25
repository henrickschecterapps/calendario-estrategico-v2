"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle, UploadCloud, FileText, Link as LinkIcon, Trash2, Loader2 } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { uploadFile } from "@/lib/uploadUtils";

interface ViagemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: any | null;
  onSaved: () => void;
}

export default function ViagemModal({ isOpen, onClose, itemToEdit, onSaved }: ViagemModalProps) {
  const [formData, setFormData] = useState<any>({
    trecho: '',
    passageiro: '',
    status: 'Pendente',
    localizador: '',
    valor: '',
    arquivos: [] as any[]
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setFormData(itemToEdit);
    } else {
      setFormData({
        trecho: '',
        passageiro: '',
        status: 'Pendente',
        localizador: '',
        valor: ''
      });
    }
    setError('');
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadFile(file, `viagens/${itemToEdit?.id || 'nova'}`);
      setFormData((prev: any) => ({
        ...prev,
        arquivos: [...(prev.arquivos || []), { 
          nome: file.name, 
          url: url, 
          tipo: file.type,
          data: new Date().toISOString() 
        }]
      }));
    } catch (err) {
      setError('Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (url: string) => {
    setFormData((prev: any) => ({
      ...prev,
      arquivos: prev.arquivos.filter((f: any) => f.url !== url)
    }));
  };

  const handleSave = async () => {
    if (!formData.passageiro || !formData.trecho) {
       setError("Passageiro e Trecho são obrigatórios.");
       return;
    }
    setSaving(true);
    try {
      const db = getFirebaseDb();
      const payload = { ...formData, updatedAt: serverTimestamp() };

      if (itemToEdit?.id) {
        await setDoc(doc(db, "viagens", itemToEdit.id), payload, { merge: true });
      } else {
        await addDoc(collection(db, "viagens"), { ...payload, createdAt: serverTimestamp() });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar a viagem.');
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
            {itemToEdit ? "Editar Viagem" : "Nova Viagem"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] bg-bg/30 custom-scrollbar">
          {error && (
            <div className="bg-red/10 text-red p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red/20">
              <AlertCircle className="w-5 h-5"/> {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
               <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Trecho / Voo</label>
               <input type="text" name="trecho" value={formData.trecho} onChange={handleChange} placeholder="Ex: GIG -> GRU" className="w-full bg-surface text-text text-base px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none font-bold transition-all" />
            </div>
            <div>
               <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Passageiro (Org)</label>
               <input type="text" name="passageiro" value={formData.passageiro} onChange={handleChange} placeholder="Nome do integrante" className="w-full bg-surface text-text text-sm px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Localizador</label>
                  <input type="text" name="localizador" value={formData.localizador} onChange={handleChange} className="w-full bg-surface text-text text-sm px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none uppercase font-black transition-all" />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-surface text-text text-sm font-bold px-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all cursor-pointer">
                     <option value="Pendente">Pendente</option>
                     <option value="Emitido">Emitido</option>
                     <option value="Cancelado">Cancelado</option>
                  </select>
               </div>
            </div>
            <div>
               <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Valor / Taxa</label>
               <div className="relative">
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-black">R$</span>
                 <input type="text" name="valor" value={formData.valor} onChange={handleChange} className="w-full bg-surface text-green text-2xl font-black pl-12 pr-5 py-4 rounded-2xl border border-border focus:border-accent outline-none transition-all" />
                </div>
            </div>

            <div className="pt-6 border-t border-border">
               <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-4 ml-1 flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Vouchers e Documentos</label>
               
               <div className="grid grid-cols-1 gap-3 mb-4">
                  {formData.arquivos?.map((file: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/5 rounded-2xl border border-border group">
                      <div className="flex items-center gap-3 truncate">
                        <FileText className="w-5 h-5 text-accent"/>
                        <span className="text-xs font-bold text-text truncate">{file.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={file.url} target="_blank" rel="noreferrer" className="p-2 text-accent hover:bg-accent/10 rounded-xl transition-all"><LinkIcon className="w-4 h-4"/></a>
                        <button onClick={() => removeFile(file.url)} className="p-2 text-red/60 hover:text-red hover:bg-red/10 rounded-xl transition-all"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
               </div>

               <label className={cn(
                 "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                 uploading ? "bg-muted/5 border-border cursor-wait" : "bg-accent/5 border-accent/20 hover:bg-accent/10 hover:border-accent/40"
               )}>
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-accent mb-2" />
                      <span className="text-[10px] font-black text-muted uppercase tracking-widest">Anexar Ticket ou Voucher</span>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
               </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-4 flex-shrink-0">
          <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-muted hover:bg-muted/10 rounded-2xl transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-10 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-black rounded-2xl shadow-lg shadow-accent/20 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4"/>}
            {saving ? 'Salvando...' : 'Salvar Viagem'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
