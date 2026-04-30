"use client";

import { useEvents } from "@/store/useEvents";
import { Filter, Calendar as CalendarIcon, List, Clock, Search, ChevronLeft, ChevronRight, LayoutDashboard, Bell, CheckCircle2, MapPin, Users, Tag, Monitor, CalendarDays, X } from "lucide-react";
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
      <div className="bg-surface/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-xs font-black text-text uppercase tracking-widest">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h4>
          <div className="flex items-center gap-1 bg-surface border border-white/5 rounded-xl p-0.5 shadow-inner">
            <button aria-label="Mês anterior" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-muted hover:text-text active:scale-95"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
            <button aria-label="Próximo mês" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-muted hover:text-text active:scale-95"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
          {days.map((d, i) => <div key={`${d}-${i}`} className="text-[10px] font-black text-muted/40 uppercase tracking-widest mb-1">{d}</div>)}
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
              <div key={i} onClick={handleDateClick} className="relative flex items-center justify-center py-0.5 cursor-pointer group">
                <span className={cn(
                  "text-xs font-bold w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-300",
                  isSelected ? "bg-accent text-white shadow-lg shadow-accent/25 scale-110 font-black" : 
                  isToday ? "bg-surface text-accent ring-1 ring-accent/30 font-black" : "text-text group-hover:bg-surface group-hover:scale-110",
                  hasEvent && !isSelected && !isToday && "font-black"
                )}>
                  {date.getDate()}
                </span>
                {hasEvent && !isSelected && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full shadow-[0_0_4px_var(--accent)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const FilterSection = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-3 w-full">
       <div className="flex items-center gap-2 px-1">
          {icon}
          <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">{title}</h3>
       </div>
       <div className="flex flex-col gap-2 w-full">
          {children}
       </div>
    </div>
  );

  const MultiSelect = ({ options, selected, toggle, placeholder }: { options: string[], selected: string[], toggle: (val: string) => void, placeholder: string }) => {
    return (
      <div className="flex flex-col gap-2 w-full">
         <select 
           className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-bold text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none cursor-pointer"
           value=""
           onChange={(e) => {
             if(e.target.value) toggle(e.target.value);
           }}
         >
           <option value="" disabled className="text-muted">{placeholder}</option>
           {options.map(o => (
             <option key={o} value={o}>{o}</option>
           ))}
         </select>
         {selected.length > 0 && (
           <div className="flex flex-wrap gap-1.5 mt-1">
              {selected.map(s => (
                 <span key={s} className="bg-accent/10 text-accent border border-accent/20 px-2 py-1.5 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1.5 group transition-colors hover:bg-accent hover:text-white">
                   {s}
                   <button onClick={(e) => { e.stopPropagation(); toggle(s); }} className="opacity-70 group-hover:opacity-100 transition-opacity"><X className="w-3.5 h-3.5"/></button>
                 </span>
              ))}
           </div>
         )}
      </div>
    );
  };

  const FilterSwitch = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
    <div onClick={onClick} className="flex items-center justify-between w-full p-3 bg-surface border border-border rounded-xl cursor-pointer hover:border-text/30 transition-all group">
      <span className="text-[11px] font-bold text-text uppercase tracking-wider">{label}</span>
      <div className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 shrink-0",
        isActive ? "bg-accent" : "bg-muted/30"
      )}>
        <span className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300",
          isActive ? "translate-x-[18px] shadow-md" : "translate-x-1"
        )} />
      </div>
    </div>
  );

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6 p-5 lg:p-6 overflow-y-auto h-full custom-scrollbar bg-surface/50 border-r border-border transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
      
      {/* 1. Header */}
      <div className="flex items-center gap-3 group">
         <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:scale-105 transition-transform">
           <Filter className="w-4 h-4 text-accent"/>
         </div>
         <h2 className="text-xs font-black text-text uppercase tracking-widest">Filtros de Busca</h2>
      </div>

      {/* 2. Mini Calendar */}
      {renderMiniCalendar()}

      {/* 3. Detailed Filters */}
      <div className="space-y-8">
        
        {/* Status */}
        <FilterSection title="Status do Evento" icon={<CheckCircle2 className="w-4 h-4 text-green"/>}>
           <MultiSelect 
             placeholder="Selecione os status..."
             options={['Confirmado', 'Em negociação', 'Planejado', 'Feriado', 'Concluído'].filter(o => !selectedStatus.includes(o))}
             selected={selectedStatus}
             toggle={toggleStatus}
           />
        </FilterSection>

        {/* Tipos */}
        <FilterSection title="Tipo de Ação" icon={<Tag className="w-4 h-4 text-accent"/>}>
           <div className="flex flex-col gap-2 w-full">
              {['Comercial', 'Comercial Interno', 'Comercial Patrocinado', 'Interno', 'Feriado'].map(t => (
                <FilterSwitch 
                  key={t} 
                  label={t} 
                  isActive={selectedTipos.includes(t)} 
                  onClick={() => toggleTipo(t)}
                />
              ))}
           </div>
        </FilterSection>

        {/* Formatos */}
        <FilterSection title="Formato" icon={<Monitor className="w-4 h-4 text-amber"/>}>
           <MultiSelect 
             placeholder="Selecione o formato..."
             options={['Presencial', 'Online', 'Híbrido'].filter(o => !selectedFormatos.includes(o))}
             selected={selectedFormatos}
             toggle={toggleFormato}
           />
        </FilterSection>

        {/* Responsáveis */}
        {allResps.length > 0 && (
          <FilterSection title="Responsáveis" icon={<Users className="w-4 h-4 text-purple"/>}>
             <MultiSelect 
               placeholder="Buscar responsáveis..."
               options={allResps.filter(o => !selectedResps.includes(o))}
               selected={selectedResps}
               toggle={toggleResp}
             />
          </FilterSection>
        )}

        {/* Período Customizado */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
              <CalendarDays className="w-4 h-4 text-red"/>
              <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">Período</h3>
           </div>
           <div className="flex items-center w-full bg-surface border border-border rounded-xl overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
              <input 
               type="date" 
               value={filterStartDate}
               onChange={(e) => setFilterStartDate(e.target.value)}
               className="w-1/2 bg-transparent px-2 py-2.5 text-[10px] font-bold text-text focus:outline-none transition-all cursor-pointer"
             />
             <span className="text-muted text-[10px] font-bold px-1">—</span>
             <input 
               type="date" 
               value={filterEndDate}
               onChange={(e) => setFilterEndDate(e.target.value)}
               className="w-1/2 bg-transparent px-2 py-2.5 text-[10px] font-bold text-text focus:outline-none transition-all cursor-pointer"
             />
           </div>
           {(filterStartDate || filterEndDate) && (
             <button 
               onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
               className="w-full py-2.5 text-[10px] font-black text-red uppercase tracking-widest hover:bg-red/5 border border-red/10 rounded-xl transition-all"
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
