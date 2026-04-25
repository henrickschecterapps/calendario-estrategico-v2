"use client";

import { useEvents } from "@/store/useEvents";
import { useAuth } from "@/store/useAuth";
import { useToast } from "@/components/ToastProvider";
import { X, MapPin, Calendar, Users, User, FileText, Copy, Trash2, Clock, ChevronDown, ChevronUp, Package, Shirt, Plane, UploadCloud, Link as LinkIcon, Trophy, AlertTriangle, CheckCircle2, Globe, ChevronRight, Star, ExternalLink, Download, Layers, Briefcase, Crown, Box, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { duplicateEvent, deleteEventFromFirestore, fetchEventHistory } from "@/lib/eventActions";
import { formatToBRDate } from "@/lib/dateUtils";
import { cn } from "../lib/utils";

export default function EventModal() {
  const { selectedEvent, setSelectedEvent, setIsEditingEvent, fetchEvents } = useEvents();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [associatedItems, setAssociatedItems] = useState<{
    brindes: any[],
    uniformes: any[],
    viagens: any[]
  }>({ brindes: [], uniformes: [], viagens: [] });
  const [loadingItems, setLoadingItems] = useState(false);
  
  const unifiedBrindes = useMemo(() => {
    const list = [...associatedItems.brindes];
    if (selectedEvent?.brindes_alocados) {
      selectedEvent.brindes_alocados.forEach((b: any) => {
        if (!list.find(item => item.id === b.id || item.nome === b.item)) {
          list.push({ id: b.id || b.docId, nome: b.item, quantidade: b.qtd, isAlocacao: true });
        }
      });
    }
    return list;
  }, [associatedItems.brindes, selectedEvent?.brindes_alocados]);

  const fetchAssociatedData = useCallback(async (eventId: string) => {
     setLoadingItems(true);
     try {
       const db = getFirebaseDb();
       const [qBri, qUni, qVia, qInv] = await Promise.all([
         getDocs(query(collection(db, "brindes"), where("evento_id", "==", eventId))),
         getDocs(query(collection(db, "uniformes"), where("evento_id", "==", eventId))),
         getDocs(query(collection(db, "viagens"), where("evento_id", "==", eventId))),
         getDocs(query(collection(db, "inventario"), where("evento_id", "==", eventId)))
       ]);

       const bri: any[] = [];
       const uni: any[] = [];
       const via: any[] = [];

       qBri.forEach(d => bri.push({ id: d.id, ...d.data() }));
       qUni.forEach(d => uni.push({ id: d.id, ...d.data() }));
       qVia.forEach(d => via.push({ id: d.id, ...d.data() }));
       qInv.forEach(d => {
          const data = d.data();
          if (data.tipo === 'brinde') bri.push({ id: d.id, ...data });
          if (data.tipo === 'uniforme') uni.push({ id: d.id, ...data });
       });

       setAssociatedItems({ brindes: bri, uniformes: uni, viagens: via });
     } catch (err) {
       console.error("Erro ao buscar itens associados:", err);
     } finally {
       setLoadingItems(false);
     }
  }, []);

  useEffect(() => {
    if (showHistory && selectedEvent?.id && !selectedEvent.id.startsWith('mock_')) {
      setLoadingHistory(true);
      fetchEventHistory(selectedEvent.id).then(h => {
        setHistory(h);
        setLoadingHistory(false);
      });
    }
  }, [showHistory, selectedEvent?.id]);

  useEffect(() => {
    setShowHistory(false);
    setHistory([]);
    setConfirmDelete(false);
    if (selectedEvent?.id) {
       fetchAssociatedData(selectedEvent.id);
    }
  }, [selectedEvent?.id, fetchAssociatedData]);

  if (!selectedEvent) return null;

  const handleDuplicate = async () => {
    try {
      await duplicateEvent(selectedEvent);
      showToast(`"${selectedEvent.evento}" duplicado com sucesso!`, "success");
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      showToast("Erro ao duplicar evento.", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deleteEventFromFirestore(selectedEvent.id);
      showToast("Evento excluído com sucesso.", "success");
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      showToast("Erro ao excluir evento.", "error");
    }
  };

  const isLive = (() => {
    const start = selectedEvent.data_ini ? new Date(selectedEvent.data_ini) : null;
    if (!start || isNaN(start.getTime())) return false;
    const end = selectedEvent.data_fim ? new Date(selectedEvent.data_fim) : start;
    const today = new Date();
    today.setHours(0,0,0,0);
    const s = new Date(start); s.setHours(0,0,0,0);
    const e = new Date(end); e.setHours(0,0,0,0);
    return today >= s && today <= e;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" onClick={() => setSelectedEvent(null)} />
      
      <div className="relative bg-surface w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-[0_40px_100px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden border border-border animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
        
        {/* Header — compact */}
        <div className="bg-surface border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
               <div className="flex flex-wrap items-center gap-2 mb-2">
                 <span className={cn(
                   "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                   selectedEvent.tipo === 'Feriado' ? 'bg-amber/10 text-amber border-amber/20' 
                   : selectedEvent.tipo?.includes('Comercial') ? 'bg-accent/10 text-accent border-accent/20' 
                   : 'bg-green/10 text-green border-green/20'
                 )}>{selectedEvent.tipo}</span>
                 <span className="bg-muted/10 text-muted px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-border">{selectedEvent.status}</span>
                 {isLive && <span className="bg-green text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm animate-pulse">Ao Vivo</span>}
               </div>
               <h2 className="text-xl font-black text-text tracking-tight leading-tight">{selectedEvent.evento || "Sem Título"}</h2>
               <div className="flex flex-wrap items-center gap-4 text-muted font-semibold text-xs mt-2">
                 <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-accent" /> {formatToBRDate(selectedEvent.data_ini)}</div>
                 <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-green" /> {selectedEvent.localidade || 'Local não definido'}</div>
                 <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-purple" /> {selectedEvent.responsavel || 'Sem Responsável'}</div>
               </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
               {isAdmin && (
                 <div className="flex items-center gap-1 bg-bg p-1 rounded-xl border border-border">
                    <button onClick={handleDuplicate} title="Duplicar Evento" className="p-2 hover:bg-surface rounded-lg transition-all text-muted hover:text-accent"><Copy className="w-4 h-4" /></button>
                    <button onClick={handleDelete} title="Excluir Evento" className={cn("p-2 rounded-lg transition-all", confirmDelete ? "bg-red text-white" : "text-muted hover:text-red hover:bg-surface")}><Trash2 className="w-4 h-4" /></button>
                 </div>
               )}
               <button onClick={() => setSelectedEvent(null)} className="p-2.5 bg-muted/10 text-muted hover:bg-text hover:text-bg rounded-xl transition-all"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Content Area — compact spacing */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar space-y-5 bg-bg/40">
          
          {/* Top Grid: Cronograma + Capacidade */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
             {/* Left: Date/Time/Location */}
             <div className="lg:col-span-7 bg-surface rounded-[24px] p-5 border border-border shadow-sm flex flex-col md:flex-row gap-5 items-stretch min-w-0">
                
                {/* Cronograma / Horario */}
                <div className="flex-1 flex flex-col justify-center">
                   <div className="flex items-start gap-3.5 pb-4 border-b border-border/50">
                      <div className="w-10 h-10 rounded-full bg-accent/5 text-accent flex items-center justify-center border border-accent/10 shrink-0">
                         <Calendar className="w-4 h-4"/>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-muted uppercase tracking-widest block mb-1">Cronograma</label>
                        <p className="text-lg font-black text-text tracking-tighter leading-none">{formatToBRDate(selectedEvent.data_ini)}</p>
                        <p className="text-[11px] font-semibold text-muted mt-1">até {formatToBRDate(selectedEvent.data_fim || selectedEvent.data_ini)}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3.5 pt-4">
                      <div className="w-10 h-10 rounded-full bg-amber/5 text-amber flex items-center justify-center border border-amber/10 shrink-0">
                         <Clock className="w-4 h-4"/>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-muted uppercase tracking-widest block mb-1">Horário</label>
                        <p className="text-lg font-black text-text tracking-tighter leading-none">{selectedEvent.hora_ini || "--:--"}</p>
                        <p className="text-[11px] font-semibold text-muted mt-1">Término: {selectedEvent.hora_fim || "--:--"}</p>
                      </div>
                   </div>
                </div>

                {/* Localidade / Patrocinio */}
                <div className="flex-[1.2] bg-bg/50 rounded-[20px] p-4 border border-border shadow-sm flex flex-col justify-center space-y-5">
                   <div className="flex items-start gap-3.5">
                     <div className="w-10 h-10 rounded-[14px] bg-green/5 text-green flex items-center justify-center border border-green/10 shrink-0">
                        <Globe className="w-4 h-4"/>
                     </div>
                     <div className="flex-1 pt-0.5 min-w-0">
                       <a 
                         href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.localidade || 'Local do Evento')}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-start gap-1 hover:text-green transition-colors group"
                         title="Ver no mapa"
                       >
                         <span className="text-sm font-black text-text leading-tight line-clamp-2 break-words">{selectedEvent.localidade || 'Local não definido'}</span>
                         <ExternalLink className="w-3 h-3 text-muted group-hover:text-green opacity-50 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                       </a>
                       <p className="text-[9px] font-black text-green uppercase tracking-widest mt-1.5">{selectedEvent.formato || 'Presencial'}</p>
                     </div>
                   </div>
                   
                   <div className="flex items-start gap-3.5">
                     <div className="w-10 h-10 rounded-[14px] bg-purple/5 text-purple flex items-center justify-center border border-purple/10 shrink-0">
                        <Trophy className="w-4 h-4"/>
                     </div>
                     <div className="pt-0.5">
                       <p className="text-sm font-black text-purple uppercase tracking-tight leading-none">{selectedEvent.cota || 'Sem Cota'}</p>
                       <p className="text-[9px] font-black text-muted uppercase tracking-[0.1em] mt-2 whitespace-nowrap">Nível de Patrocínio</p>
                     </div>
                   </div>
                </div>
             </div>

             {/* Right: Capacidade */}
             <div className="lg:col-span-5 bg-surface rounded-xl p-5 border border-border shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-muted/5 text-muted flex items-center justify-center border border-border"><Users className="w-3.5 h-3.5"/></div>
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-text">Capacidade Operacional</h3>
                </div>
                <div className="space-y-2 flex-1 flex flex-col justify-center">
                   {[
                     { label: 'Staff Tripla', value: selectedEvent.vagas_staff, color: 'bg-accent', total: selectedEvent.equipe?.length || 0 },
                     { label: 'Clientes', value: selectedEvent.vagas_cliente, color: 'bg-green', total: selectedEvent.clientes?.length || 0 },
                     { label: 'VIPs', value: selectedEvent.vagas_vip, color: 'bg-purple', total: selectedEvent.vips?.length || 0 }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between gap-3 p-3 bg-bg/30 border border-border rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className={cn("w-1 h-6 rounded-full", item.color)} />
                           <span className="text-[10px] font-black text-muted uppercase tracking-wider">{item.label}</span>
                        </div>
                        <span className="text-lg font-black text-text">{item.total}<span className="text-[10px] text-muted/50 ml-1">/{item.value || 0}</span></span>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Equipe Técnica */}
          <div className="bg-surface rounded-xl p-5 border border-border shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-xl bg-accent text-bg flex items-center justify-center shadow-md shadow-accent/15"><Users className="w-4 h-4"/></div>
                   <div>
                      <h3 className="text-sm font-black text-text tracking-tight">Equipe Técnica Alocada</h3>
                      <p className="text-[9px] font-black text-muted uppercase tracking-widest">{selectedEvent.equipe?.length || 0} Especialistas em Campo</p>
                   </div>
                </div>
             </div>
             
             {selectedEvent.equipe && selectedEvent.equipe.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                   {selectedEvent.equipe.map((member: any, i: number) => (
                     <div key={i} className="flex items-center gap-3 p-3 bg-bg/40 border border-border rounded-xl group hover:border-accent/20 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-[10px] font-black text-muted uppercase shrink-0 group-hover:text-accent transition-colors">
                           {member.nome.substring(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="text-xs font-bold text-text truncate leading-tight">{member.nome}</p>
                           <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[8px] font-black text-accent uppercase tracking-wider bg-accent/5 px-1.5 py-px rounded border border-accent/10">{member.cargo || member.funcao || 'Equipe'}</span>
                              {member.tamanho && (
                                <span className="text-[8px] font-black text-muted uppercase tracking-wider bg-surface px-1.5 py-px rounded border border-border">{member.tamanho}</span>
                              )}
                           </div>
                           {isAdmin && <p className="text-[9px] font-semibold text-muted/50 mt-0.5 flex items-center gap-1"><Briefcase className="w-2.5 h-2.5"/> {member.celular || 'Sem Contato'}</p>}
                        </div>
                     </div>
                   ))}
                </div>
             ) : (
                <div className="py-6 border border-dashed border-border rounded-xl text-center flex flex-col items-center justify-center gap-2">
                   <Users className="w-5 h-5 text-muted/20" />
                   <p className="text-[9px] font-black text-muted/40 uppercase tracking-widest">Nenhuma equipe escalada</p>
                </div>
             )}
          </div>

          {/* Clients + VIPs side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-surface rounded-xl p-5 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-9 h-9 rounded-xl bg-green/10 text-green flex items-center justify-center border border-green/20"><Briefcase className="w-4 h-4"/></div>
                   <div>
                      <h3 className="text-sm font-black text-text tracking-tight">Clientes</h3>
                      <p className="text-[9px] font-black text-green uppercase tracking-widest">{selectedEvent.clientes?.length || 0} Confirmados</p>
                   </div>
                </div>
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                   {selectedEvent.clientes && selectedEvent.clientes.length > 0 ? selectedEvent.clientes.map((cli: any, i: number) => (
                     <div key={i} className="flex items-center justify-between p-2.5 bg-green/5 border border-green/10 rounded-lg transition-all hover:bg-green/10">
                        <div className="min-w-0">
                           <p className="text-xs font-bold text-text truncate">{cli.nome}</p>
                           <p className="text-[9px] font-black text-green uppercase tracking-wider">{cli.empresa}</p>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green shrink-0"/>
                     </div>
                   )) : (
                     <div className="text-center py-4">
                        <p className="text-[9px] font-black text-muted/40 uppercase tracking-widest">Nenhum cliente</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="bg-surface rounded-xl p-5 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-9 h-9 rounded-xl bg-purple/10 text-purple flex items-center justify-center border border-purple/20"><Crown className="w-4 h-4"/></div>
                   <div>
                      <h3 className="text-sm font-black text-text tracking-tight">Convidados VIP</h3>
                      <p className="text-[9px] font-black text-purple uppercase tracking-widest">{selectedEvent.vips?.length || 0} Confirmados</p>
                   </div>
                </div>
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                   {selectedEvent.vips && selectedEvent.vips.length > 0 ? selectedEvent.vips.map((vip: any, i: number) => (
                     <div key={i} className="flex items-center justify-between p-2.5 bg-purple/5 border border-purple/10 rounded-lg transition-all hover:bg-purple/10">
                        <div className="min-w-0">
                           <p className="text-xs font-bold text-text truncate">{vip.nome}</p>
                           <p className="text-[9px] font-black text-purple uppercase tracking-wider">{vip.cargo || 'VIP'}</p>
                        </div>
                        <Star className="w-3.5 h-3.5 text-purple fill-purple shrink-0"/>
                     </div>
                   )) : (
                     <div className="text-center py-4">
                        <p className="text-[9px] font-black text-muted/40 uppercase tracking-widest">Nenhum VIP</p>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Logistics Row */}
          {(() => {
             let uniformesText = selectedEvent.uniforme || 'N/D';
             if (selectedEvent.equipe && selectedEvent.equipe.length > 0) {
                 const sizeCounts = selectedEvent.equipe.reduce((acc: any, member: any) => {
                     const size = member.tamanho;
                     if (size && size !== '--') {
                        acc[size] = (acc[size] || 0) + 1;
                     }
                     return acc;
                 }, {});

                 const sizeEntries = Object.entries(sizeCounts);
                 if (sizeEntries.length > 0) {
                     uniformesText = sizeEntries
                        .map(([size, count]) => `${size}: ${count} un`)
                        .join(', ');
                 }
             }

             return (
               <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <Shirt className="w-4 h-4"/>, label: 'Uniformes', value: uniformesText },
                    { icon: <Package className="w-4 h-4"/>, label: 'Brindes', value: selectedEvent.brindes_alocados?.length > 0 ? selectedEvent.brindes_alocados.map((b:any) => `${b.qtd}x ${b.item}`).join(', ') : selectedEvent.brinde },
                    { icon: <Box className="w-4 h-4"/>, label: 'Materiais', value: selectedEvent.materiais }
                  ].map((box, i) => (
                    <div key={i} className="bg-surface rounded-xl p-4 border border-border shadow-sm flex items-start gap-3 overflow-hidden">
                       <div className="w-8 h-8 rounded-lg bg-bg text-muted flex items-center justify-center border border-border shrink-0 mt-0.5">{box.icon}</div>
                       <div className="min-w-0 flex-1">
                          <label className="text-[8px] font-black text-muted uppercase tracking-widest block mb-0.5">{box.label}</label>
                          <p className="text-xs font-bold text-text whitespace-normal break-words leading-relaxed" title={box.value || 'N/D'}>{box.value || 'N/D'}</p>
                       </div>
                    </div>
                  ))}
               </div>
             );
          })()}

          {/* Content & Docs */}
          {(selectedEvent.descricao || selectedEvent.conteudo || selectedEvent.publico || selectedEvent.beneficios || selectedEvent.obs || (selectedEvent.arquivos && selectedEvent.arquivos.length > 0)) && (
            <div className="bg-surface rounded-xl p-5 border border-border shadow-sm space-y-5">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange/10 text-orange flex items-center justify-center border border-orange/20"><FileText className="w-4 h-4"/></div>
                  <h3 className="text-sm font-black text-text tracking-tight">Conteúdo e Documentos</h3>
               </div>
               
               {selectedEvent.publico && (
                 <div>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1">Público Alvo</span>
                    <p className="text-xs font-medium text-text">{selectedEvent.publico}</p>
                 </div>
               )}

               {selectedEvent.beneficios && (
                 <div>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1">Benefícios / Entregas</span>
                    <p className="text-xs font-medium text-text leading-relaxed whitespace-pre-wrap">{selectedEvent.beneficios}</p>
                 </div>
               )}

               {(selectedEvent.descricao || selectedEvent.conteudo) && (
                 <div>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1">Briefing / Detalhes</span>
                    <div className="bg-bg/50 p-3 rounded-lg border border-border">
                       <p className="text-xs text-text leading-relaxed whitespace-pre-wrap font-medium">{selectedEvent.descricao || selectedEvent.conteudo}</p>
                    </div>
                 </div>
               )}

               {selectedEvent.obs && (
                 <div>
                    <span className="text-[10px] font-black text-amber uppercase tracking-widest block mb-1">Observações Internas</span>
                    <div className="bg-amber/5 p-3 rounded-lg border border-amber/10">
                       <p className="text-xs text-amber leading-relaxed whitespace-pre-wrap font-medium">{selectedEvent.obs}</p>
                    </div>
                 </div>
               )}

               {selectedEvent.arquivos && selectedEvent.arquivos.length > 0 && (
                 <div>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Arquivos Anexados</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {selectedEvent.arquivos.map((arq: any, i: number) => (
                         <a key={i} href={arq.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-bg/50 hover:bg-bg border border-border hover:border-accent/50 rounded-lg transition-all group">
                            <FileText className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0"/>
                            <span className="text-xs font-bold text-text truncate">{arq.nome}</span>
                         </a>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}

        </div>

        {/* Footer — slim */}
        <div className="px-6 py-3 bg-surface border-t border-border flex items-center justify-between flex-shrink-0">
           <div className="flex items-center gap-2 text-[9px] font-black text-muted uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Tripla v2.0
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => setSelectedEvent(null)} className="text-[10px] font-black text-muted hover:text-text transition-all uppercase tracking-widest">Fechar</button>
              <button 
                onClick={() => setIsEditingEvent(true)}
                className="bg-text text-bg hover:bg-text/90 px-6 py-2.5 rounded-xl font-black text-[11px] shadow-lg shadow-text/10 transition-all uppercase tracking-wider flex items-center gap-2 active:scale-95"
              >
                Editar Evento <ChevronRight className="w-3.5 h-3.5"/>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
