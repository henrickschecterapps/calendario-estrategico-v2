"use client";

import { useAuth } from "@/store/useAuth";
import { useEvents } from "@/store/useEvents";
import { Loader2, Calendar as CalendarGridIcon, Users, Package, Activity, Filter, X } from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import SidebarFilters from "@/components/SidebarFilters";
import EventCard, { getTypeColor, getStatusInfo } from "@/components/EventCard";
import EventModal from "@/components/EventModal";
import EventFormModal from "@/components/EventFormModal";
import TopBar from "@/components/TopBar";
import CalendarGrid from "@/components/CalendarGrid";
import CommentsPanel from "@/components/CommentsPanel";
import ActivityLogModal from "@/components/ActivityLogModal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseEventStringDate, formatToBRDate } from "@/lib/dateUtils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useToast } from "@/components/ToastProvider";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    events, fetchEvents, loading: eventsLoading, showPastEvents, setShowPastEvents, 
    selectedResps, filterStartDate, filterEndDate, searchQuery, setSearchQuery,
    selectedTipos, selectedStatus, selectedFormatos,
    setSelectedEvent, setIsEditingEvent
  } = useEvents();
  const router = useRouter();
  
  // Custom View State (timeline, month, week, list)
  const [activeView, setActiveView] = useState<"timeline" | "month" | "week" | "list">("timeline");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { showToast } = useToast();
  const toastShown = useRef(false);

  // Keyboard shortcuts (legacy parity: ← → to navigate views, N for new, ESC for close)
  const VIEW_ORDER: ("timeline" | "month" | "week" | "list")[] = ["timeline", "month", "week", "list"];
  const handleViewChange = useCallback((direction: "prev" | "next") => {
    setActiveView(prev => {
      const idx = VIEW_ORDER.indexOf(prev);
      if (direction === "next") return VIEW_ORDER[Math.min(idx + 1, VIEW_ORDER.length - 1)];
      return VIEW_ORDER[Math.max(idx - 1, 0)];
    });
  }, []);
  useKeyboardShortcuts({ onViewChange: handleViewChange });

  // Welcome toast (legacy: shows keyboard shortcut hints on first load)
  useEffect(() => {
    if (user && !toastShown.current) {
      toastShown.current = true;
      const timer = setTimeout(() => {
        showToast("💡 Dica: use ← → para navegar entre views, N para novo evento.", "info", 5000);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user, showToast]);

  // Redirect e Boot
  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, fetchEvents]);

  // Lógica de Filtragem Local (Similar a v1)
  const filteredEvents = useMemo(() => {
    let list = [...events];
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter by Resps
    if (selectedResps.length > 0) {
      list = list.filter(e => {
        if (!e.responsavel) return false;
        const resps = e.responsavel.split(',').map(r => r.trim());
        return selectedResps.some(selected => resps.includes(selected));
      });
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => 
        (e.evento?.toLowerCase() || '').includes(q) || 
        (e.responsavel?.toLowerCase() || '').includes(q) ||
        (e.formato?.toLowerCase() || '').includes(q)
      );
    }

    // Filter by Tipos
    if (selectedTipos.length > 0) {
      list = list.filter(e => e.tipo && selectedTipos.includes(e.tipo));
    }

    // Filter by Status
    if (selectedStatus.length > 0) {
      list = list.filter(e => e.status && selectedStatus.includes(e.status));
    }

    // Filter by Formatos
    if (selectedFormatos.length > 0) {
      list = list.filter(e => e.formato && selectedFormatos.includes(e.formato));
    }

    // Temporality Filter (Past Events Toggle)
    if (!showPastEvents && !searchQuery) {
      list = list.filter(e => {
        const d = parseEventStringDate(e.data_ini);
        if (!d) return true;
        const evMonthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        return evMonthStart.getTime() >= currentMonthStart.getTime();
      });
    }

    // Filter by Date Range
    if (filterStartDate) {
      const sd = new Date(filterStartDate + "T00:00:00");
      list = list.filter(e => {
        const d = parseEventStringDate(e.data_ini);
        return d ? d >= sd : true;
      });
    }
    if (filterEndDate) {
      const ed = new Date(filterEndDate + "T23:59:59");
      list = list.filter(e => {
        const d = parseEventStringDate(e.data_ini);
        return d ? d <= ed : true;
      });
    }

    // Sort by Date Asc
    return list.sort((a, b) => {
      const da = parseEventStringDate(a.data_ini) || new Date(2030,0);
      const db = parseEventStringDate(b.data_ini) || new Date(2030,0);
      return da.getTime() - db.getTime();
    });
  }, [events, selectedResps, selectedTipos, selectedStatus, selectedFormatos, showPastEvents, searchQuery, filterStartDate, filterEndDate]);

  // Group events by month for the Timeline view
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: { monthStr: string, count: number, events: typeof filteredEvents } } = {};
    
    filteredEvents.forEach(ev => {
      const d = parseEventStringDate(ev.data_ini);
      if (!d) return; // Skip if no valid date
      
      const monthKey = format(d, 'yyyy-MM');
      const monthStr = format(d, 'MMMM', { locale: ptBR });
      const capitalizedMonthStr = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
      
      if (!groups[monthKey]) {
        groups[monthKey] = { monthStr: capitalizedMonthStr, count: 0, events: [] };
      }
      groups[monthKey].events.push(ev);
      groups[monthKey].count++;
    });
    
    // Convert to sorted array
    return Object.keys(groups).sort().map(k => groups[k]);
  }, [filteredEvents]);

  if (authLoading || !user) {
    return <div className="flex-1 flex w-full h-screen items-center justify-center p-4 bg-bg"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-bg overflow-hidden text-text">
      
      {/* HEADER SUPERIOR V1 CLÁSSICO */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
           <div 
             className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-[60] lg:hidden"
             onClick={() => setIsSidebarOpen(false)}
           />
        )}

        {/* FILTROS LATERAL ESQUERDA */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-[70] transform lg:static lg:translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] w-[85%] max-w-[320px] lg:w-auto h-full shadow-2xl lg:shadow-none bg-bg lg:bg-transparent",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
           <div className="absolute top-6 right-6 lg:hidden z-50">
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-surface/80 backdrop-blur-md rounded-full border border-border text-muted hover:text-text shadow-sm"><X className="w-5 h-5"/></button>
           </div>
           <SidebarFilters />
        </div>

        {/* FEED PRINCIPAL TIMELINE */}
        <main className="flex-1 flex flex-col min-w-0 bg-bg w-full">
          {/* Header — compact single row */}
          <header className="flex-shrink-0 px-4 md:px-10 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2.5 bg-surface border border-border rounded-xl text-text hover:bg-muted/10 transition-colors shadow-sm"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg md:text-xl font-black text-text tracking-tight leading-none">Calendário Estratégico</h1>
                  <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">Gestão Integrada de Eventos</p>
                </div>
              </div>
              <div className="flex md:hidden items-center gap-2">
                <button 
                  onClick={() => { setSelectedEvent(null); setIsEditingEvent(true); }}
                  className="bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl font-black text-[10px] shadow-lg shadow-accent/15 transition-all active:scale-[0.97] flex items-center gap-2 shrink-0"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Novo Evento</span>
                  <span className="sm:hidden">Novo</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
              <button 
                onClick={() => setShowPastEvents(!showPastEvents)}
                className="hidden sm:flex bg-surface border border-border shadow-sm px-4 py-1.5 rounded-full text-[9px] font-black text-muted uppercase tracking-widest hover:text-accent hover:border-accent/30 transition-all active:scale-95 shrink-0"
              >
                {showPastEvents ? "Ocultar anteriores" : "Ver anteriores"}
              </button>
              
              <div className="flex lg:hidden items-center bg-surface/60 p-1 rounded-xl border border-border shadow-inner relative shrink-0">
                 {(["timeline", "month", "week", "list"] as const).map((view) => (
                   <button 
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors duration-300 whitespace-nowrap ${activeView === view ? "bg-surface text-accent shadow-sm border border-border" : "text-muted hover:text-text"}`}
                   >
                     {view === "timeline" ? "Timeline" : view === "month" ? "Mês" : view === "week" ? "Semana" : "Lista"}
                   </button>
                 ))}
              </div>

              <div className="hidden lg:flex items-center bg-surface/60 p-1.5 rounded-2xl border border-border shadow-inner relative shrink-0">
                <div 
                  className="absolute top-1.5 bottom-1.5 w-[100px] bg-surface border border-border/50 rounded-xl shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{ transform: `translateX(${["timeline", "month", "week", "list"].indexOf(activeView) * 100}%)` }}
                />
                {(["timeline", "month", "week", "list"] as const).map((view) => (
                   <button 
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`relative z-10 w-[100px] py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-colors duration-300 ${activeView === view ? "text-accent" : "text-muted hover:text-text"}`}
                   >
                     {view === "timeline" ? "Timeline" : view === "month" ? "Mês" : view === "week" ? "Semana" : "Lista"}
                   </button>
                ))}
              </div>

              <button 
                onClick={() => { setSelectedEvent(null); setIsEditingEvent(true); }}
                className="hidden md:flex bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-xl font-black text-xs shadow-lg shadow-accent/15 transition-all active:scale-[0.97] items-center gap-2 shrink-0"
              >
                <Activity className="w-3.5 h-3.5" />
                Novo Evento
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 md:px-10 pb-8 relative flex flex-col h-full min-h-0 custom-scrollbar">
            {/* KPI Strip — compact horizontal cards */}
            {!eventsLoading && activeView === "timeline" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-surface px-4 py-3 rounded-xl border border-border shadow-sm flex items-center gap-3 group hover:shadow-md transition-all">
                  <div className="w-9 h-9 bg-accent/5 text-accent rounded-xl flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all shrink-0">
                    <CalendarGridIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none">Eventos/Mês</p>
                    <p className="text-xl font-black text-text leading-none mt-0.5">
                      {events.filter(e => {
                        const d = parseEventStringDate(e.data_ini);
                        return d && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                      }).length}
                    </p>
                  </div>
                </div>

                <div className="bg-surface px-4 py-3 rounded-xl border border-border shadow-sm flex items-center gap-3 group hover:shadow-md transition-all">
                  <div className="w-9 h-9 bg-green/5 text-green rounded-xl flex items-center justify-center group-hover:bg-green group-hover:text-white transition-all shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none">Total Staff</p>
                    <p className="text-xl font-black text-text leading-none mt-0.5">
                      {events.reduce((acc, e) => {
                        const d = parseEventStringDate(e.data_ini);
                        if (d && d >= new Date()) {
                          return acc + (Number(e.vagas_staff) || 0) + (Number(e.vagas_cliente) || 0) + (Number(e.vagas_vip) || 0);
                        }
                        return acc;
                      }, 0)}
                    </p>
                  </div>
                </div>

                <div className="bg-surface px-4 py-3 rounded-xl border border-border shadow-sm flex items-center gap-3 group hover:shadow-md transition-all">
                  <div className="w-9 h-9 bg-amber/5 text-amber rounded-xl flex items-center justify-center group-hover:bg-amber group-hover:text-white transition-all shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none">Logística</p>
                    <p className="text-xl font-black text-text leading-none mt-0.5">
                      {events.filter(e => {
                        const d = parseEventStringDate(e.data_ini);
                        return d && d >= new Date() && (!e.arquivos || e.arquivos.length === 0);
                      }).length}
                    </p>
                  </div>
                </div>

                <div className="bg-surface px-4 py-3 rounded-xl border border-border shadow-sm flex items-center gap-3 group hover:shadow-md transition-all">
                  <div className="w-9 h-9 bg-purple/5 text-purple rounded-xl flex items-center justify-center group-hover:bg-purple group-hover:text-white transition-all shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none">Em Campo</p>
                    <p className="text-xl font-black text-text leading-none mt-0.5">
                      {events.reduce((acc, e) => {
                        const d = parseEventStringDate(e.data_ini);
                        const d2 = parseEventStringDate(e.data_fim) || d;
                        const today = new Date();
                        if (d && d2 && today >= d && today <= d2) {
                          return acc + (e.equipe?.length || 0);
                        }
                        return acc;
                      }, 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {eventsLoading ? (
               <div className="flex flex-col gap-10">
                 {/* KPI Skeletons */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="h-40 bg-surface rounded-[28px] border border-border animate-pulse" />
                   ))}
                 </div>
                 {/* Timeline Skeletons */}
                 <div className="space-y-8">
                   <div className="h-10 w-48 bg-surface rounded-xl animate-pulse" />
                   {[1,2,3].map(i => (
                     <div key={i} className="h-32 bg-surface rounded-[24px] border border-border animate-pulse" />
                   ))}
                 </div>
               </div>
            ) : (
               activeView === "timeline" ? (
                  <div className="flex flex-col pb-10">
                    {groupedEvents.length === 0 ? (
                      <div className="text-center py-24 bg-surface border-2 border-border border-dashed rounded-[32px] mt-4 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-muted/5 rounded-full flex items-center justify-center text-muted">
                           <CalendarGridIcon className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-muted font-bold text-lg">Nenhum evento corresponde aos filtros atuais.</p>
                      </div>
                    ) : (
                      groupedEvents.map((group, idx) => (
                        <div key={idx} className="mb-10 relative">
                           {/* Mês Header - Clean & Sharp */}
                           <div className="flex items-center gap-6 mb-6 sticky top-0 bg-bg/95 backdrop-blur-md z-20 py-5 border-b border-border">
                             <h2 className="text-2xl font-black text-text tracking-tight uppercase">{group.monthStr}</h2>
                             <span className="bg-muted/10 text-muted px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-border">
                               {group.count} {group.count === 1 ? 'Evento' : 'Eventos'}
                             </span>
                             <div className="flex-1 h-[1px] bg-border ml-2" />
                           </div>
                           
                           <div className="grid grid-cols-1 gap-4">
                             {group.events.map(ev => <EventCard key={ev.id} event={ev} />)}
                           </div>
                        </div>
                      ))
                    )}
                  </div>
               ) : activeView === "list" ? (
                  <div className="bg-surface border border-border rounded-[24px] shadow-xl flex flex-col overflow-hidden mt-4 pb-0 mb-10">
                      <div className="overflow-x-auto custom-scrollbar">
                           <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                            <thead>
                               <tr className="bg-bg/50 border-b border-border text-muted font-black uppercase text-[10px] tracking-[0.2em]">
                                  <th className="py-6 px-8">Data</th>
                                  <th className="py-6 px-8">Evento</th>
                                  <th className="py-6 px-8">Tipo</th>
                                  <th className="py-6 px-8">Status</th>
                                  <th className="py-6 px-8">Participantes</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                               {filteredEvents.length > 0 ? filteredEvents.map(evt => {
                                  const evDate = parseEventStringDate(evt.data_ini);
                                  const nowDate = new Date(); nowDate.setHours(0,0,0,0);
                                  const isPast = (evDate && evDate.getTime() < nowDate.getTime()) || evt.status?.toLowerCase() === 'concluído';
                                  const statusInfo = getStatusInfo(evt.status || '');
                                  return (
                                   <tr key={evt.id} 
                                       onClick={() => setSelectedEvent(evt)} 
                                       className={`transition-all group cursor-pointer ${isPast ? 'opacity-40 hover:opacity-100 grayscale-[0.5] hover:grayscale-0' : 'hover:bg-bg/40'}`}
                                   >
                                      <td className="py-5 px-8 font-black text-muted tracking-tighter">{formatToBRDate(evt.data_ini)}</td>
                                      <td className="py-5 px-8">
                                        <div className="flex items-center gap-3">
                                          <span className="font-black text-text text-base group-hover:text-accent transition-colors">{evt.evento}</span>
                                          {(() => {
                                            if (!evDate || isPast) return null;
                                            const diff = Math.ceil((evDate.getTime() - nowDate.getTime()) / 86400000);
                                            if (diff === 0) return <span className="text-[9px] font-black bg-green/10 text-green px-2 py-0.5 rounded-lg animate-pulse tracking-widest border border-green/20">AO VIVO</span>;
                                            if (diff <= 7) return <span className="text-[9px] font-black bg-text text-bg px-2 py-0.5 rounded-lg tracking-widest border border-border">EM {diff}D</span>;
                                            return null;
                                          })()}
                                        </div>
                                      </td>
                                      <td className="py-5 px-8">
                                         <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-widest border ${getTypeColor(evt.tipo || '')}`}>{evt.tipo || '—'}</span>
                                      </td>
                                      <td className="py-5 px-8">
                                         <span className={`flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-xl tracking-widest border transition-all ${statusInfo.color}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                            {evt.status || '—'}
                                         </span>
                                      </td>
                                      <td className="py-5 px-8">
                                         <div className="flex -space-x-1.5">
                                            {evt.equipe && evt.equipe.length > 0 ? (
                                               evt.equipe.slice(0,3).map((m: any, i: number) => (
                                                  <div key={i} className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-black text-muted shadow-sm">
                                                     {m.nome?.substring(0,2).toUpperCase() || '??'}
                                                  </div>
                                               ))
                                            ) : <span className="text-muted/40 font-bold">N/D</span>}
                                            {evt.equipe && evt.equipe.length > 3 && (
                                               <div className="w-8 h-8 rounded-full bg-muted/10 border border-border flex items-center justify-center text-[10px] font-black text-muted">
                                                  +{evt.equipe.length - 3}
                                               </div>
                                            )}
                                         </div>
                                      </td>
                                   </tr>
                                  );
                               }) : (
                                  <tr>
                                     <td colSpan={5} className="py-16 text-center text-muted/40 font-black uppercase tracking-[0.2em]">Nenhum evento encontrado.</td>
                                  </tr>
                                )}
                            </tbody>
                           </table>
                      </div>
                  </div>
               ) : (
                  <div className="flex-1 h-full min-h-[600px] pb-10 mt-4">
                    {/* Exibe o Super Grid interativo injetando os cards diretamente nos dias corretos! */}
                    <CalendarGrid eventsToRender={filteredEvents} view={activeView} onView={(v) => setActiveView(v as any)} />
                  </div>
               )
            )}
          </div>
        </main>
      </div>

      <EventModal />
      <EventFormModal />
      <CommentsPanel />
      <ActivityLogModal />
    </div>
  );
}
