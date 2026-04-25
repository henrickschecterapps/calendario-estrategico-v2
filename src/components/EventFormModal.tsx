"use client";

import { useEvents } from "@/store/useEvents";
import { useAuth } from "@/store/useAuth";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmDialog";
import { X, Save, AlertCircle, MapPin, Link as LinkIcon, Users, User, Star, Trash2, Plus, Box, Info, History, Briefcase, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, getDoc, getDocs } from "firebase/firestore";
import { logEventHistory } from "@/lib/eventActions";
import { TriplaEvent } from "@/types/evento";
import { Loader2, UploadCloud, FileText } from "lucide-react";
import { uploadFile } from "@/lib/uploadUtils";
import { cn } from "@/lib/utils";

interface EventFormModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  eventToEdit?: any;
  onSaved?: () => void;
}

export default function EventFormModal({ isOpen, onClose, eventToEdit, onSaved }: EventFormModalProps = {}) {
  const { isEditingEvent, setIsEditingEvent, selectedEvent, fetchEvents, setSelectedEvent } = useEvents();
  
  const finalOpen = isOpen !== undefined ? isOpen : isEditingEvent;
  const finalEvent = eventToEdit !== undefined ? eventToEdit : selectedEvent;
  const finalOnClose = onClose !== undefined ? onClose : () => { setIsEditingEvent(false); setSelectedEvent(null); };
  const finalOnSaved = onSaved !== undefined ? onSaved : fetchEvents;
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<any>({
    evento: '',
    data_ini: '',
    data_fim: '',
    hora_ini: '',
    hora_fim: '',
    responsavel: '',
    tipo: 'Comercial',
    status: 'Planejado',
    formato: 'Presencial',
    cota: '',
    localidade: '',
    links: '',
    organizadores: [] as string[],
    vagas_staff: 0,
    vagas_cliente: 0,
    vagas_vip: 0,
    equipe: [] as any[],
    clientes: [] as any[],
    vips: [] as any[],
    brindes_alocados: [] as any[],
    publico: '',
    participantes: '',
    beneficios: '',
    obs: '',
    arquivos: [] as { nome: string, url: string, tipo: string }[],
    historico: [] as any[]
  });

  // Aux state for adding members
  const [newEquipeInfo, setNewEquipeInfo] = useState({ nome: '', funcao: '', tamanho: 'M' });
  const [newClienteInfo, setNewClienteInfo] = useState({ nome: '', empresa: '' });
  const [newVipInfo, setNewVipInfo] = useState({ nome: '', obs: '' });
  const [newBrinde, setNewBrinde] = useState({ id: '', item: '', qtd: 1 });
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [participantesDb, setParticipantesDb] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!finalOpen) return;
    const fetchInventory = async () => {
      try {
        const db = await getFirebaseDb();
        const snap = await getDocs(collection(db, "inventario"));
        const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })).filter((i: any) => i.tipo === 'almoxarifado');
        setInventoryItems(items);
        if (items.length > 0) {
          setNewBrinde({ id: items[0].id, item: items[0].nome, qtd: 1 });
        }
      } catch (err) {}
    };
    fetchInventory();

    const fetchParticipantes = async () => {
      try {
        const db = await getFirebaseDb();
        const snap = await getDocs(collection(db, "participantes"));
        setParticipantesDb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {}
    };
    fetchParticipantes();
  }, [finalOpen]);

  useEffect(() => {
    if (finalOpen) {
      if (finalEvent) {
        setFormData({
          ...finalEvent,
          organizadores: finalEvent.organizadores || [],
          equipe: finalEvent.equipe || [],
          clientes: finalEvent.clientes || [],
          vips: finalEvent.vips || [],
          brindes_alocados: finalEvent.brindes_alocados || [],
          historico: finalEvent.historico || []
        });
      } else {
        setFormData({
          evento: '', data_ini: '', data_fim: '', hora_ini: '', hora_fim: '', responsavel: '', tipo: 'Comercial', status: 'Planejado', formato: 'Presencial', cota: '', localidade: '', links: '', organizadores: [], vagas_staff: 0, vagas_cliente: 0, vagas_vip: 0, equipe: [], clientes: [], vips: [], brindes_alocados: [], publico: '', participantes: '', beneficios: '', obs: '', historico: []
        });
      }
    }
  }, [finalOpen, finalEvent]);

  if (!finalOpen) return null;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOrgCheck = (org: string) => {
    setFormData((prev: any) => ({
      ...prev,
      organizadores: prev.organizadores.includes(org) 
        ? prev.organizadores.filter((o: string) => o !== org)
        : [...prev.organizadores, org]
    }));
  };

  const addEquipe = () => {
    if (!newEquipeInfo.nome) return;
    setFormData((prev: any) => ({
      ...prev,
      equipe: [...prev.equipe, { ...newEquipeInfo, id: Date.now().toString() }]
    }));
    setNewEquipeInfo({ nome: '', funcao: '', tamanho: 'M' });
  };

  const addCliente = () => {
    if (!newClienteInfo.nome) return;
    setFormData((prev: any) => ({
      ...prev,
      clientes: [...(prev.clientes || []), { ...newClienteInfo, id: Date.now().toString() }]
    }));
    setNewClienteInfo({ nome: '', empresa: '' });
  };

  const addVip = () => {
    if (!newVipInfo.nome) return;
    setFormData((prev: any) => ({
      ...prev,
      vips: [...(prev.vips || []), { ...newVipInfo, id: Date.now().toString() }]
    }));
    setNewVipInfo({ nome: '', obs: '' });
  };

  const addBrinde = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newBrinde.id || !newBrinde.item || newBrinde.qtd <= 0) return;
    
    const invItem = inventoryItems.find((i: any) => i.id === newBrinde.id);
    if (!invItem || (Number(invItem.quantidade) || 0) < newBrinde.qtd) {
       showToast(`Estoque insuficiente. Saldo atual do item "${newBrinde.item}" é ${invItem?.quantidade || 0}.`, 'error');
       return;
    }

    const confirmed = await confirm({
      title: "Alocar Brinde do Almoxarifado",
      message: `Deseja alocar ${newBrinde.qtd} unid(s) de "${newBrinde.item}"? Essa ação descontará IMEDIATAMENTE o seu inventário.`,
      confirmText: "Sim, Alocar",
      cancelText: "Cancelar"
    });
    
    if (!confirmed) return;

    try {
      const db = await getFirebaseDb();
      const currentDoc = await getDoc(doc(db, "inventario", newBrinde.id));
      const currQtd = Number(currentDoc.data()?.quantidade) || 0;
      await updateDoc(doc(db, "inventario", newBrinde.id), {
        quantidade: Math.max(0, currQtd - newBrinde.qtd)
      });
      
      setInventoryItems(prev => prev.map((i:any) => i.id === newBrinde.id ? {...i, quantidade: Math.max(0, currQtd - newBrinde.qtd)} : i));

      setFormData((prev: any) => ({
        ...prev,
        brindes_alocados: [...(prev.brindes_alocados || []), { ...newBrinde, docId: Date.now().toString() }]
      }));
      setNewBrinde(prev => ({ ...prev, qtd: 1 }));
      showToast('Estoque abatido e brinde alocado!', 'success');
    } catch (err: any) {
      showToast('Erro ao subtrair o inventário.', 'error');
    }
  };

  const removeBrinde = async (e: React.MouseEvent, b: any) => {
    e.preventDefault();
    const confirmed = await confirm({
      title: "Devolver ao Almoxarifado",
      message: `Deseja remover "${b.item}" do evento e devolver ${b.qtd} unid(s) ao estoque?`,
      confirmText: "Sim, Devolver",
      cancelText: "Cancelar"
    });
    
    if (!confirmed) return;

    try {
      const db = await getFirebaseDb();
      if (b.id) {
         const currentDoc = await getDoc(doc(db, "inventario", b.id));
         if (currentDoc.exists()) {
             const currQtd = Number(currentDoc.data()?.quantidade) || 0;
             await updateDoc(doc(db, "inventario", b.id), {
               quantidade: currQtd + Number(b.qtd)
             });
             setInventoryItems(prev => prev.map((i:any) => i.id === b.id ? {...i, quantidade: currQtd + Number(b.qtd)} : i));
         }
      }

      setFormData((prev: any) => ({
        ...prev,
        brindes_alocados: prev.brindes_alocados.filter((item: any) => b.docId ? item.docId !== b.docId : item.id !== b.id)
      }));
      showToast('Brinde removido e estoque devolvido com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao devolver ao inventário.', 'error');
    }
  };

  const removeArrayItem = (key: string, id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: prev[key].filter((item: any) => item.id !== id && item.url !== id)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadFile(file, `eventos/${selectedEvent?.id || 'novo'}`);
      setFormData((prev: any) => ({
        ...prev,
        arquivos: [...(prev.arquivos || []), { 
          nome: file.name, 
          url: url, 
          tipo: file.type,
          data: new Date().toISOString() 
        }]
      }));
      showToast('Arquivo enviado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao enviar arquivo.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.evento || !formData.data_ini) {
      setError("O nome do evento e a data inicial são obrigatórios!");
      document.getElementById('form-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const db = await getFirebaseDb();
      const collectionRef = collection(db, "eventos");

      const authorName = user?.email?.split('@')[0]?.replace('.', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Admin';
      const novoHistorico = {
        editor: authorName,
        data: new Date().toISOString(),
        acao: selectedEvent ? 'Edição' : 'Criação',
        status: formData.status,
        tipo: formData.tipo
      };

      const responsavelStr = formData.organizadores?.length > 0 
        ? formData.organizadores.join(', ') 
        : formData.responsavel || '';

      const finalData = { 
        ...formData, 
        responsavel: responsavelStr,
        historico: [novoHistorico, ...(formData.historico || [])] 
      };

      if (finalEvent?.id) {
        await updateDoc(doc(db, "eventos", finalEvent.id), finalData);
        await logEventHistory(finalEvent.id, 'Editado', user?.email || 'unknown', `Atualização geral`);
        showToast('Evento atualizado!', 'success');
      } else {
        const docRef = await addDoc(collectionRef, finalData);
        await logEventHistory(docRef.id, 'Criado', user?.email || 'unknown', `Evento criado`);
        showToast('Evento criado! 🎉', 'success');
      }

      await finalOnSaved();
      finalOnClose();
    } catch (err: any) {
      setError("Erro ao salvar evento");
      showToast('Erro ao salvar no banco.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const defaultOrgs = ["Gente & Gestão", "Jessica Alves (SP)", "Jessica Andrade (BH)", "Marketing"];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" onClick={() => !loading && finalOnClose()} />
      
      <div className="relative bg-surface w-full max-w-5xl max-h-[90vh] rounded-[24px] shadow-[0_40px_100px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden border border-border animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-surface sticky top-0 z-20">
          <h2 className="text-2xl font-black text-text tracking-tight flex items-center gap-3">
             <div className="w-1.5 h-6 bg-accent rounded-full" />
             {finalEvent ? 'Editar Evento' : 'Novo Evento'}
          </h2>
          <div className="flex gap-4">
             <button onClick={finalOnClose} disabled={loading} className="px-6 py-2.5 text-sm font-bold text-muted hover:bg-muted/10 rounded-xl transition-all">Cancelar</button>
             <button onClick={handleSave} disabled={loading} className="px-10 py-2.5 text-sm font-black bg-accent hover:bg-accent-hover text-white rounded-xl shadow-lg shadow-accent/20 transition-all flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                Salvar Evento
             </button>
          </div>
        </div>

        {/* Scrollable Form */}
        <div id="form-scroll" className="p-10 overflow-y-auto flex-1 bg-bg/50 custom-scrollbar">
          {error && (
            <div className="mb-8 bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border border-rose-100 shadow-sm">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-12 pb-10">

             {/* SEÇÃO 1: DADOS BÁSICOS */}
             <section className="bg-surface p-8 rounded-[24px] border border-border shadow-sm space-y-8">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-black">1</div>
                  <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">Dados Identificadores</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                   <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Nome do Evento *</label>
                   <input type="text" name="evento" value={formData.evento || ''} onChange={handleChange} className="w-full bg-bg text-text text-base px-5 py-4 rounded-xl border border-border focus:border-accent font-bold outline-none transition-all placeholder:text-muted/50" placeholder="Digite o nome do evento..." />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Data Início</label>
                      <input type="date" name="data_ini" value={formData.data_ini || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-4 py-3.5 rounded-xl border border-border outline-none font-bold focus:border-accent transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Data Fim</label>
                      <input type="date" name="data_fim" value={formData.data_fim || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-4 py-3.5 rounded-xl border border-border outline-none font-bold focus:border-accent transition-all" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">🕒 Hora Início</label>
                      <input type="time" name="hora_ini" value={formData.hora_ini || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-4 py-3.5 rounded-xl border border-border outline-none font-bold focus:border-accent transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">🕒 Hora Fim</label>
                      <input type="time" name="hora_fim" value={formData.hora_fim || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-4 py-3.5 rounded-xl border border-border outline-none font-bold focus:border-accent transition-all" />
                    </div>
                 </div>

                 <div>
                   <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Tipo de Evento</label>
                   <select name="tipo" value={formData.tipo || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-4 py-3.5 rounded-xl border border-border outline-none font-bold focus:border-accent transition-all">
                     <option value="Comercial">Comercial</option>
                     <option value="Comercial Interno">Comercial Interno</option>
                     <option value="Comercial Patrocinado">Comercial Patrocinado</option>
                     <option value="Interno">Interno</option>
                     <option value="Feriado">Feriado</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Status Operacional</label>
                   <select name="status" value={formData.status || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-4 py-3.5 rounded-xl border border-border outline-none font-bold focus:border-accent transition-all">
                     <option value="Planejado">Planejado</option>
                     <option value="Em negociação">Em negociação</option>
                     <option value="Confirmado">Confirmado</option>
                     <option value="Concluído">Concluído</option>
                     <option value="Cancelado">Cancelado</option>
                   </select>
                 </div>
               </div>
             </section>

             {/* SEÇÃO 2: LOCAL E ESTRATÉGIA */}
             <section className="bg-surface p-8 rounded-[24px] border border-border shadow-sm space-y-8">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple/10 text-purple flex items-center justify-center font-black">2</div>
                  <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">Local e Canais</h3>
               </div>

               <div className="space-y-6">
                 <div>
                   <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Localização Física / Link Principal</label>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/40" />
                      <input type="text" name="localidade" value={formData.localidade || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm pl-12 pr-5 py-4 rounded-xl border border-border outline-none font-bold focus:border-purple/50 transition-all placeholder:text-muted/50" placeholder="Ex: Escritório SP, Hotel Transamérica..." />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Formato</label>
                     <input type="text" name="formato" value={formData.formato || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-4 py-3.5 rounded-xl border border-border outline-none font-bold focus:border-accent transition-all" placeholder="Ex: Presencial, Híbrido..." />
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Cota Comercial</label>
                     <input type="text" name="cota" value={formData.cota || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-4 py-3.5 rounded-xl border border-border outline-none font-bold focus:border-accent transition-all" placeholder="Ex: Gold, Silver, Master..." />
                   </div>
                 </div>

                 <div>
                   <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Links e Repositórios (um por linha)</label>
                   <textarea name="links" rows={3} value={formData.links || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-5 py-4 rounded-xl border border-border outline-none font-medium focus:border-accent transition-all placeholder:text-muted/50" placeholder="https://..." />
                 </div>
               </div>
             </section>

             {/* SEÇÃO 3: PARTICIPANTES E GESTÃO */}
             <section className="bg-surface p-8 rounded-[24px] border border-border shadow-sm space-y-10">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-green/10 text-green flex items-center justify-center font-black">3</div>
                   <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">Participantes e Equipe</h3>
                </div>

                {/* Vagas Numéricas */}
                <div className="bg-muted/5 p-6 rounded-2xl border border-border grid grid-cols-3 gap-6">
                   <div>
                     <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-2">Staff (Qtd)</label>
                     <input type="number" name="vagas_staff" value={formData.vagas_staff || 0} onChange={handleChange} className="w-full bg-surface text-sm px-4 py-3 rounded-xl border border-border font-black text-accent" />
                   </div>
                   <div>
                     <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-2">Clientes (Qtd)</label>
                     <input type="number" name="vagas_cliente" value={formData.vagas_cliente || 0} onChange={handleChange} className="w-full bg-surface text-sm px-4 py-3 rounded-xl border border-border font-black text-green" />
                   </div>
                   <div>
                     <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-2">VIPs (Qtd)</label>
                     <input type="number" name="vagas_vip" value={formData.vagas_vip || 0} onChange={handleChange} className="w-full bg-surface text-sm px-4 py-3 rounded-xl border border-border font-black text-purple" />
                   </div>
                </div>

                {/* Áreas Organizadoras */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-muted uppercase tracking-widest">Áreas Responsáveis</label>
                  <div className="flex flex-wrap gap-4 bg-muted/5 p-5 rounded-2xl border border-border">
                     {defaultOrgs.map(org => (
                       <label key={org} className="flex items-center gap-3 cursor-pointer select-none">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.organizadores?.includes(org) ? 'bg-accent border-accent shadow-md shadow-accent/20' : 'bg-surface border-border'}`}>
                            {formData.organizadores?.includes(org) && <X className="w-4 h-4 text-white rotate-45" />}
                          </div>
                          <span className={cn("text-xs font-bold transition-colors", formData.organizadores?.includes(org) ? "text-text" : "text-muted")}>{org}</span>
                          <input type="checkbox" className="hidden" checked={formData.organizadores?.includes(org)} onChange={() => handleOrgCheck(org)} />
                       </label>
                     ))}
                  </div>
                </div>

                {/* LISTA NOMINAL: CLIENTES */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="block text-[10px] font-black text-green uppercase tracking-widest">Lista de Clientes</label>
                     <span className="text-[10px] font-black text-muted/40">{formData.clientes?.length || 0} NOMES</span>
                  </div>
                  <div className="space-y-3">
                     {formData.clientes?.map((c: any) => (
                       <div key={c.id} className="flex items-center justify-between bg-surface border border-border p-3 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-green/10 text-green flex items-center justify-center text-[10px] font-black">CL</div>
                             <div>
                                <p className="text-sm font-bold text-text">{c.nome}</p>
                                <p className="text-[10px] text-muted font-bold uppercase">{c.empresa || "Sem Empresa"}</p>
                             </div>
                          </div>
                          <button onClick={() => removeArrayItem('clientes', c.id)} className="p-2 text-red/60 hover:bg-red/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                       </div>
                     ))}
                     <div className="flex gap-3 bg-green/5 p-4 rounded-2xl border border-green/10">
                        <input type="text" placeholder="Nome do Cliente" value={newClienteInfo.nome} onChange={e => setNewClienteInfo({...newClienteInfo, nome: e.target.value})} className="flex-1 bg-surface text-sm px-4 py-2.5 rounded-xl border border-border outline-none focus:border-green/50 transition-all" />
                        <input type="text" placeholder="Empresa/Cargo" value={newClienteInfo.empresa} onChange={e => setNewClienteInfo({...newClienteInfo, empresa: e.target.value})} className="w-1/3 bg-surface text-sm px-4 py-2.5 rounded-xl border border-border outline-none focus:border-green/50 transition-all" />
                        <button onClick={addCliente} className="bg-green text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green/20">Add</button>
                     </div>
                  </div>
                </div>

                {/* LISTA NOMINAL: VIPs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="block text-[10px] font-black text-purple uppercase tracking-widest">Lista de VIPs</label>
                     <span className="text-[10px] font-black text-muted/40">{formData.vips?.length || 0} NOMES</span>
                  </div>
                  <div className="space-y-3">
                     {formData.vips?.map((v: any) => (
                       <div key={v.id} className="flex items-center justify-between bg-surface border border-border p-3 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-purple/10 text-purple flex items-center justify-center text-[10px] font-black">VIP</div>
                             <div>
                                <p className="text-sm font-bold text-text">{v.nome}</p>
                                <p className="text-[10px] text-muted font-bold uppercase">{v.obs || "Sem Notas"}</p>
                             </div>
                          </div>
                          <button onClick={() => removeArrayItem('vips', v.id)} className="p-2 text-red/60 hover:bg-red/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                       </div>
                     ))}
                     <div className="flex gap-3 bg-purple/5 p-4 rounded-2xl border border-purple/10">
                        <input type="text" placeholder="Nome do VIP" value={newVipInfo.nome} onChange={e => setNewVipInfo({...newVipInfo, nome: e.target.value})} className="flex-1 bg-surface text-sm px-4 py-2.5 rounded-xl border border-border outline-none focus:border-purple/50 transition-all" />
                        <input type="text" placeholder="Obs / Restrições" value={newVipInfo.obs} onChange={e => setNewVipInfo({...newVipInfo, obs: e.target.value})} className="w-1/3 bg-surface text-sm px-4 py-2.5 rounded-xl border border-border outline-none focus:border-purple/50 transition-all" />
                        <button onClick={addVip} className="bg-purple text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple/20">Add</button>
                     </div>
                  </div>
                </div>

                {/* Equipe Técnica */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-muted uppercase tracking-widest">Equipe Técnica alocada</label>
                  <div className="space-y-3">
                     {formData.equipe?.map((m: any, idx: number) => (
                       <div key={m.id || `member-${idx}`} className="flex items-center justify-between bg-surface border border-border p-3 rounded-xl shadow-sm">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-[10px] font-black">ET</div>
                             <div>
                                <p className="text-sm font-bold text-text">{m.nome}</p>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{m.funcao} • T: {m.tamanho}</p>
                             </div>
                          </div>
                          <button onClick={() => removeArrayItem('equipe', m.id)} className="p-2 text-red/60 hover:bg-red/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                       </div>
                     ))}
                     <div className="flex gap-2 bg-accent/5 p-4 rounded-2xl border border-accent/10">
                        <select 
                           value={newEquipeInfo.nome} 
                           onChange={e => {
                             const p = participantesDb.find(x => x.nome === e.target.value);
                             setNewEquipeInfo({ nome: e.target.value, funcao: p?.funcao || '', tamanho: p?.tamanho || 'M' });
                           }}
                           className="flex-1 bg-surface text-text text-sm px-4 py-2.5 rounded-xl border border-border font-bold outline-none focus:border-accent/50 transition-all"
                        >
                           <option value="">Selecionar Membro...</option>
                           {participantesDb.sort((a,b) => a.nome.localeCompare(b.nome)).map(p => (
                              <option key={p.id} value={p.nome}>{p.nome}</option>
                           ))}
                        </select>
                        <input type="text" placeholder="Função" value={newEquipeInfo.funcao} onChange={e => setNewEquipeInfo({...newEquipeInfo, funcao: e.target.value})} className="w-32 bg-surface text-text text-sm px-4 py-2.5 rounded-xl border border-border outline-none focus:border-accent/50 transition-all" />
                        <select value={newEquipeInfo.tamanho} onChange={e => setNewEquipeInfo({...newEquipeInfo, tamanho: e.target.value})} className="w-32 bg-surface text-text text-sm px-2 rounded-xl border border-border outline-none focus:border-accent/50 transition-all">
                           <option>P</option><option>M</option><option>G</option><option>GG</option><option>XG</option>
                           <option>Baby Look P</option><option>Baby Look M</option><option>Baby Look G</option><option>Baby Look GG</option>
                        </select>
                        <button onClick={addEquipe} className="bg-accent text-white px-5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20">Add</button>
                     </div>
                  </div>
                </div>
             </section>

             {/* SEÇÃO 4: LOGÍSTICA E ALMOXARIFADO */}
             <section className="bg-surface p-8 rounded-[24px] border border-border shadow-sm space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-text text-bg flex items-center justify-center font-black">4</div>
                   <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">Logística e Almoxarifado</h3>
                </div>

                <div className="bg-amber/5 p-6 rounded-2xl border border-amber/10 space-y-6">
                   <h4 className="flex items-center gap-2 text-[10px] font-black text-amber uppercase tracking-widest"><Box className="w-4 h-4"/> Alocação de Brindes</h4>
                   
                   <div className="space-y-2">
                      {formData.brindes_alocados?.map((b: any, index: number) => (
                        <div key={b.docId || b.id || index} className="flex items-center justify-between bg-surface border border-border p-3 rounded-xl shadow-sm">
                           <span className="text-sm font-bold text-text/80">{b.item}</span>
                           <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-accent bg-accent/10 px-3 py-1 rounded-lg">QTD: {b.qtd}</span>
                              <button onClick={(e) => removeBrinde(e, b)} className="p-1.5 text-red/60 hover:text-red hover:bg-red/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="flex gap-3 items-end bg-surface p-4 rounded-2xl border border-border shadow-sm">
                       <div className="flex-1">
                         <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-1.5 ml-1">Item do Inventário</label>
                         <select 
                           value={newBrinde.id} 
                           onChange={e => {
                             const selected = inventoryItems.find(i => i.id === e.target.value);
                             if (selected) setNewBrinde({ id: selected.id, item: selected.nome, qtd: newBrinde.qtd });
                           }} 
                           className="w-full bg-bg text-text text-sm px-4 py-2.5 rounded-xl border border-border outline-none font-bold focus:border-amber/50 transition-all"
                         >
                           <option value="">Selecione...</option>
                           {inventoryItems.map((item: any) => (
                              <option key={item.id} value={item.id}>{item.nome} (Saldo: {item.quantidade || 0})</option>
                           ))}
                         </select>
                       </div>
                       <div className="w-24">
                         <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-1.5 ml-1">Qtd.</label>
                         <input type="number" min="1" value={newBrinde.qtd} onChange={e => setNewBrinde({...newBrinde, qtd: parseInt(e.target.value)})} className="w-full bg-bg text-text text-sm px-4 py-2.5 rounded-xl border border-border outline-none font-black focus:border-amber/50 transition-all" />
                       </div>
                       <button onClick={addBrinde} className="bg-text text-bg px-6 h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-text/10 transition-all hover:bg-text/90">Alocar</button>
                   </div>
                </div>
             </section>

             {/* SEÇÃO 5: CONTEÚDO E ANEXOS */}
             <section className="bg-surface p-8 rounded-[24px] border border-border shadow-sm space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center font-black">5</div>
                   <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">Conteúdo e Documentos</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Público Alvo</label>
                    <input type="text" name="publico" value={formData.publico || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-5 py-4 rounded-xl border border-border outline-none font-bold focus:border-accent transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Benefícios / Entregas</label>
                    <textarea name="beneficios" rows={2} value={formData.beneficios || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-5 py-4 rounded-xl border border-border outline-none font-medium focus:border-accent transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Descrição Detalhada / Briefing</label>
                    <textarea name="descricao" rows={4} value={formData.descricao || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-5 py-4 rounded-xl border border-border outline-none font-medium focus:border-accent transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">Observações Internas</label>
                    <textarea name="obs" rows={3} value={formData.obs || ''} onChange={handleChange} className="w-full bg-bg text-text text-sm px-5 py-4 rounded-xl border border-border outline-none font-medium focus:border-accent transition-all" />
                  </div>

                  {/* Anexos */}
                  <div className="pt-6 border-t border-border">
                     <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-4">Anexos e Documentos</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {formData.arquivos?.map((file: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-muted/5 rounded-2xl border border-border group">
                             <div className="flex items-center gap-3 truncate">
                                <FileText className="w-5 h-5 text-accent" />
                                <span className="text-xs font-bold text-text truncate">{file.nome}</span>
                             </div>
                             <button onClick={() => removeArrayItem('arquivos', file.url)} className="text-red/60 hover:text-red p-2 transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        ))}
                     </div>
                     <label className={cn(
                       "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-[24px] cursor-pointer transition-all",
                       uploading ? "bg-muted/5 border-border cursor-wait" : "bg-accent/5 border-accent/20 hover:bg-accent/10 hover:border-accent/40"
                     )}>
                        {uploading ? <Loader2 className="w-8 h-8 text-accent animate-spin" /> : <UploadCloud className="w-8 h-8 text-accent mb-2" />}
                        <p className="text-xs font-black text-muted uppercase tracking-widest">Enviar Documento</p>
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                     </label>
                  </div>
                </div>
             </section>

          </div>
        </div>

      </div>
    </div>
  );
}
