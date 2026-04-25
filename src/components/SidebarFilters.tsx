"use client";

import { useEvents } from "@/store/useEvents";
import { Filter, Calendar as CalendarIcon, List, Clock, Search, ChevronLeft, ChevronRight, LayoutDashboard, Bell, CheckCircle2, MapPin, Users, Tag, Monitor, CalendarDays } from "lucide-react";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { cn } from "../lib/utils";
import { parseEventStringDate } from "@/lib/dateUtils";

export default function SidebarFilters() {
  const { 
    selectedStatus, toggleStatus,
    selectedTipos, toggleTipo,
    selectedResps, toggleResp,
    selectedFormatos, toggleFormato,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    events 
  } = useEvents();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all unique responsibles from events
  const allResps = useMemo(() => {
    const resps = new Set<string>();
    events.forEach(e => {
      if (e.responsavel) {
        e.responsavel.split(',').forEach(r => resps.add(r.trim()));
      }
    });
    return Array.from(resps).sort();
  }, [events]);

  const eventDatesSet = useMemo(() => {
    const set = new Set();
    events.forEach(e => {
      const d = parseEventStringDate(e.data_ini);
      if (d) set.add(format(d, "yyyy-MM-dd"));
    });
    return set;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter(e => {
        const d = parseEventStringDate(e.data_ini);
        return d && d >= new Date();
      })
      .sort((a, b) => {
        const da = parseEventStringDate(a.data_ini);
        const db = parseEventStringDate(b.data_ini);
        return (da?.getTime() || 0) - (db?.getTime() || 0);
      })
      .slice(0, 4); // show up to 4
  }, [events]);

  const renderMiniCalendar = () => {
    const days = ["D", "S", "T", "Q", "Q", "S", "S"];
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDay = start.getDay();
    const dateArr = [];
    for (let i = 0; i < startDay; i++) dateArr.push(null);
    for (let i = 1; i <= end.getDate(); i++) dateArr.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

    return (
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[11px] font-black text-text uppercase tracking-widest">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h4>
          <div className="flex gap-1">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-muted/10 rounded-md transition-colors text-muted hover:text-text"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-muted/10 rounded-md transition-colors text-muted hover:text-text"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center">
          {days.map((d, i) => <div key={`${d}-${i}`} className="text-[9px] font-bold text-muted uppercase">{d}</div>)}
          {dateArr.map((date, i) => {
            if (!date) return <div key={i} />;
            const dateStr = format(date, "yyyy-MM-dd");
            const hasEvent = eventDatesSet.has(dateStr);
            const isSelected = filterStartDate === dateStr && filterEndDate === dateStr;
            const isToday = isSameDay(date, new Date());

            const handleDateClick = () => {
              if (isSelected) {
                setFilterStartDate('');
                setFilterEndDate('');
              } else {
                setFilterStartDate(dateStr);
                setFilterEndDate(dateStr);
              }
            };

            return (
              <div key={i} onClick={handleDateClick} className="relative flex items-center justify-center py-1 cursor-pointer group">
                <span className={cn(
                  "text-xs font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                  isSelected ? "bg-accent text-white shadow-md scale-110" : 
                  isToday ? "bg-muted/20 text-text" : "text-text group-hover:bg-muted/10",
                  hasEvent && !isSelected && !isToday && "text-accent font-black bg-accent/5 ring-1 ring-accent/20"
                )}>
                  {date.getDate()}
                </span>
                {hasEvent && !isSelected && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const FilterSection = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-3">
       <div className="flex items-center gap-2 px-1">
          {icon}
          <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">{title}</h3>
       </div>
       <div className="flex flex-wrap gap-1.5">
          {children}
       </div>
    </div>
  );

  const FilterBadge = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] border",
        isActive 
          ? "bg-text text-bg border-text shadow-[0_4px_12px_rgba(0,0,0,0.1)] scale-[1.02]" 
          : "bg-surface text-muted border-border hover:border-text/30 hover:text-text hover:bg-muted/5 hover:scale-[1.02]"
      )}
    >
      {label}
    </button>
  );

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-8 p-6 lg:p-8 overflow-y-auto h-full custom-scrollbar bg-surface/50 border-r border-border transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
      
      {/* 1. Header */}
      <div className="flex items-center gap-4 group">
         <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shadow-sm border border-border group-hover:rotate-3 transition-transform">
           <Filter className="w-5 h-5 text-accent"/>
         </div>
         <div>
            <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none mb-1">Painel de</p>
            <p className="text-sm font-black text-text uppercase tracking-tight leading-none">Filtros</p>
         </div>
      </div>

      {/* 2. Mini Calendar */}
      {renderMiniCalendar()}

      {/* 3. Detailed Filters */}
      <div className="space-y-8">
        
        {/* Status */}
        <FilterSection title="Status do Evento" icon={<CheckCircle2 className="w-4 h-4 text-green"/>}>
           {['Confirmado', 'Em negociação', 'Planejado', 'Feriado', 'Concluído'].map(s => (
             <FilterBadge 
               key={s} 
               label={s} 
               isActive={selectedStatus.includes(s)} 
               onClick={() => toggleStatus(s)} 
             />
           ))}
        </FilterSection>

        {/* Tipos */}
        <FilterSection title="Tipo de Ação" icon={<Tag className="w-4 h-4 text-accent"/>}>
           {['Comercial Patrocinado', 'Comercial Direto', 'Interno', 'Feriado'].map(t => (
             <FilterBadge 
               key={t} 
               label={t} 
               isActive={selectedTipos.includes(t)} 
               onClick={() => toggleTipo(t)} 
             />
           ))}
        </FilterSection>

        {/* Formatos */}
        <FilterSection title="Formato" icon={<Monitor className="w-4 h-4 text-amber"/>}>
           {['Presencial', 'Online', 'Híbrido'].map(f => (
             <FilterBadge 
               key={f} 
               label={f} 
               isActive={selectedFormatos.includes(f)} 
               onClick={() => toggleFormato(f)} 
             />
           ))}
        </FilterSection>

        {/* Responsáveis */}
        {allResps.length > 0 && (
          <FilterSection title="Responsáveis" icon={<Users className="w-4 h-4 text-purple"/>}>
             {allResps.map(r => (
               <FilterBadge 
                 key={r} 
                 label={r} 
                 isActive={selectedResps.includes(r)} 
                 onClick={() => toggleResp(r)} 
               />
             ))}
          </FilterSection>
        )}

        {/* Período Customizado */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
              <CalendarDays className="w-4 h-4 text-red"/>
              <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">Período</h3>
           </div>
           <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                 <label className="text-[9px] font-bold text-muted uppercase tracking-widest px-1">Início</label>
                 <input 
                  type="date" 
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-bold text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                 <label className="text-[9px] font-bold text-muted uppercase tracking-widest px-1">Fim</label>
                 <input 
                  type="date" 
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-bold text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>
           </div>
           {(filterStartDate || filterEndDate) && (
             <button 
               onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
               className="w-full py-2 text-[10px] font-black text-red uppercase tracking-widest hover:bg-red/5 border border-red/10 rounded-xl transition-all"
             >
               Limpar Período
             </button>
           )}
        </div>

      </div>

      {/* 4. Upcoming Reminders */}
      <div className="pt-6 border-t border-border space-y-4 pb-4">
         <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-text uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1 h-3 bg-amber rounded-full" />
              Próximos Eventos
            </h3>
         </div>
         <div className="space-y-3">
            {upcomingEvents.length > 0 ? upcomingEvents.map((e, idx) => (
              <div key={idx} className="group relative pl-3 border-l-2 border-border hover:border-amber transition-all py-1">
                 <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">{format(parseEventStringDate(e.data_ini)!, "dd MMM", { locale: ptBR })}</p>
                 <p className="text-xs font-bold text-text leading-tight group-hover:text-amber transition-all line-clamp-2">{e.evento}</p>
              </div>
            )) : (
              <div className="text-center py-5 border border-dashed border-border rounded-xl bg-bg/50">
                 <p className="text-[9px] text-muted/60 font-bold uppercase tracking-widest">Sem eventos próximos</p>
              </div>
            )}
         </div>
      </div>

    </aside>
  );
}
