"use client";

import { useEvents } from "@/store/useEvents";
import { X, Activity, Calendar as CalendarIcon, User, Edit3, Plus, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ActivityLogModal() {
  const { events, isActivityModalOpen, setIsActivityModalOpen, setSelectedEvent } = useEvents();

  if (!isActivityModalOpen) return null;

  // Extrair e achatar todo o histórico de todos os eventos
  const allActivities = events.flatMap((ev) => {
    if (!ev.historico) return [];
    return ev.historico.map((h: any) => ({
      ...h,
      eventRef: ev, // Para sabermos de qual evento veio
      timestamp: new Date(h.data).getTime()
    }));
  }).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50); // Pegar os últimos 50

  const getActionIcon = (acao: string) => {
    const a = acao.toLowerCase();
    if (a.includes("criação") || a.includes("criado")) return <Plus className="w-4 h-4 text-green" />;
    if (a.includes("edição") || a.includes("editado") || a.includes("atualização")) return <Edit3 className="w-4 h-4 text-accent" />;
    if (a.includes("concluído")) return <CheckCircle2 className="w-4 h-4 text-purple" />;
    return <Activity className="w-4 h-4 text-amber" />;
  };

  const getActionColor = (acao: string) => {
    const a = acao.toLowerCase();
    if (a.includes("criação") || a.includes("criado")) return "bg-green/10 border-green/20 text-green";
    if (a.includes("edição") || a.includes("editado") || a.includes("atualização")) return "bg-accent/10 border-accent/20 text-accent";
    if (a.includes("concluído")) return "bg-purple/10 border-purple/20 text-purple";
    return "bg-amber/10 border-amber/20 text-amber";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={() => setIsActivityModalOpen(false)}
      />
      
      <div className="relative bg-surface w-full max-w-2xl max-h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-border animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber/10 flex items-center justify-center border border-amber/20 shadow-sm">
              <Activity className="w-6 h-6 text-amber" />
            </div>
            <div>
              <h2 className="text-xl font-black text-text tracking-tight leading-none">Últimas Atividades</h2>
              <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Registro da Equipe</p>
            </div>
          </div>
          <button 
            onClick={() => setIsActivityModalOpen(false)}
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-muted/10 text-muted transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-bg/50">
          {allActivities.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
               <Activity className="w-12 h-12 text-muted mb-4" />
               <p className="text-sm font-bold text-muted">Nenhuma atividade registrada.</p>
             </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
              {allActivities.map((act, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon Marker */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-bg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${getActionColor(act.acao)}`}>
                    {getActionIcon(act.acao)}
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-border bg-surface shadow-sm transition-all hover:shadow-md hover:border-accent/30 cursor-pointer" onClick={() => { setIsActivityModalOpen(false); setSelectedEvent(act.eventRef); }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted">{format(new Date(act.data), "dd MMM, HH:mm", { locale: ptBR })}</span>
                      <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${getActionColor(act.acao)}`}>{act.acao}</span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-text leading-tight mb-1 group-hover:text-accent transition-colors">
                      {act.eventRef.evento}
                    </h4>
                    
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <div className="w-5 h-5 rounded-full bg-muted/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-muted" />
                      </div>
                      <span className="text-xs font-semibold text-muted">{act.editor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
