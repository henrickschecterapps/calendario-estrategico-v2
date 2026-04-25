"use client";

import { useEvents } from "@/store/useEvents";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo } from "react";
import { TriplaEvent } from "@/types/evento";
import { parseEventStringDate } from "@/lib/dateUtils";

// Configuração do Localizer
const locales = {
  "pt-BR": ptBR,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

export default function CalendarGrid({ eventsToRender, view, onView }: { eventsToRender: TriplaEvent[], view: string, onView: (v: string) => void }) {
  const { setSelectedEvent } = useEvents();

  // Transforma nossos eventos no formato que o RBC pede
  const rbcEvents = useMemo(() => {
    return eventsToRender.map(ev => {
      const start = parseEventStringDate(ev.data_ini) || new Date();
      let end = parseEventStringDate(ev.data_fim);
      if (!end) end = start;

      return {
        id: ev.id,
        title: ev.evento || "Sem Título",
        start,
        end,
        resource: ev, // Guarda o evento original
      };
    });
  }, [eventsToRender]);

  const eventStyleGetter = (event: any) => {
    const originalEvent = event.resource as TriplaEvent;
    
    // Cores baseadas nas variáveis CSS do tema
    const isComercial = originalEvent.tipo?.includes("Comercial");
    let bg = "var(--green)"; // Default
    if (originalEvent.tipo === "Feriado") bg = "var(--amber)";
    if (isComercial) bg = "var(--accent)";

    return {
      style: {
        backgroundColor: bg,
        borderRadius: "8px",
        opacity: 0.95,
        color: "#fff",
        border: "none",
        display: "block",
        fontSize: "11px",
        fontWeight: "900",
        padding: "4px 8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        textTransform: "uppercase" as any,
        letterSpacing: "0.025em"
      }
    };
  };

  return (
    <div className="h-full w-full bg-surface rounded-[28px] shadow-high-depth border border-border p-6 custom-rbc font-sans flex flex-col transition-all duration-500">
      <style dangerouslySetInnerHTML={{__html: `
        .custom-rbc .rbc-toolbar { margin-bottom: 24px; font-family: var(--font-heading); }
        .custom-rbc .rbc-toolbar-label { font-weight: 900; font-size: 1.5rem; color: var(--text); text-transform: capitalize; tracking: -0.025em; }
        .custom-rbc .rbc-btn-group button { border-radius: 12px; border: 1px solid var(--border); color: var(--muted); font-weight: 800; padding: 8px 16px; margin-left: 6px; transition: all 0.2s; background: var(--surface); text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; }
        .custom-rbc .rbc-btn-group button:hover { background: var(--bg); color: var(--text); border-color: var(--muted); }
        .custom-rbc .rbc-btn-group button.rbc-active { background: var(--accent); color: white; border-color: var(--accent); box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); pointer-events: none; }
        
        .custom-rbc .rbc-header { padding: 16px 10px; font-weight: 900; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.2em; border-bottom: 1px solid var(--border); border-left: none; }
        .custom-rbc .rbc-month-view { border-radius: 20px; border: 1px solid var(--border); overflow: hidden; background: var(--surface); }
        .custom-rbc .rbc-month-row { border-top: 1px solid var(--border); }
        .custom-rbc .rbc-day-bg { border-left: 1px solid var(--border); transition: background 0.3s; }
        .custom-rbc .rbc-day-bg:hover { background-color: var(--bg); opacity: 0.5; }
        
        .custom-rbc .rbc-today { background-color: var(--accent) !important; position: relative; }
        .custom-rbc .rbc-today::after { content: ''; position: absolute; inset: 2px; border: 2px solid var(--surface); border-radius: 4px; pointer-events: none; opacity: 0.2; }
        .custom-rbc .rbc-today .rbc-date-cell { color: white !important; }
        
        .custom-rbc .rbc-date-cell { font-weight: 900; font-size: 13px; padding: 10px 12px; color: var(--text); }
        .custom-rbc .rbc-off-range-bg { background-color: var(--bg); opacity: 0.3; }
        .custom-rbc .rbc-off-range .rbc-date-cell { color: var(--muted); opacity: 0.4; }
        
        .custom-rbc .rbc-event { padding: 0; outline: none; margin-top: 2px; margin-bottom: 2px; }
        .custom-rbc .rbc-event:hover { filter: brightness(1.1); transform: translateY(-1px); transition: all 0.2s; }
        
        .custom-rbc .rbc-agenda-view { border-radius: 20px; overflow: hidden; border: 1px solid var(--border); }
        .custom-rbc .rbc-agenda-table { background: var(--surface); }
        .custom-rbc .rbc-agenda-table thead > tr > th { background: var(--bg); color: var(--muted); font-weight: 900; padding: 12px; font-size: 10px; text-transform: uppercase; }
        .custom-rbc .rbc-agenda-table tbody > tr > td { padding: 12px; border-top: 1px solid var(--border); color: var(--text); font-weight: 600; }
      `}} />
      <Calendar
        localizer={localizer}
        events={rbcEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ flex: 1 }}
        culture="pt-BR"
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(e) => setSelectedEvent(e.resource as TriplaEvent)}
        views={["month", "week", "agenda"]}
        view={view as any}
        onView={onView as any}
        messages={{
          today: 'Hoje',
          previous: 'Anterior',
          next: 'Próximo',
          month: 'Mês',
          week: 'Semana',
          day: 'Dia',
          agenda: 'Lista',
          noEventsInRange: 'Não há eventos neste período.'
        }}
      />
    </div>
  );
}
