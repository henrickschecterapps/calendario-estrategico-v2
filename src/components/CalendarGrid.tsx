"use client";

import { useEvents } from "@/store/useEvents";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo, useState } from "react";
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
  const [currentDate, setCurrentDate] = useState(new Date());

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
      className: "premium-rbc-event",
      style: {
        backgroundColor: "transparent",
        borderRadius: "0",
        color: bg,
        border: "none",
        borderLeft: `3px solid ${bg}`,
        display: "block",
        fontSize: "11px",
        fontWeight: "700",
        padding: "4px 8px",
        textTransform: "uppercase" as any,
        letterSpacing: "0.05em",
        marginTop: "2px",
        marginBottom: "2px",
      }
    };
  };

  return (
    <div className="h-full w-full bg-surface/40 backdrop-blur-3xl rounded-[32px] shadow-high-depth border border-white/20 p-4 sm:p-8 custom-rbc font-sans flex flex-col transition-all duration-500">
      <style dangerouslySetInnerHTML={{__html: `
        /* EDITORIAL MINIMALIST CALENDAR DESIGN */
        .custom-rbc { border: none; background: transparent; padding: 0; }
        
        /* Toolbar */
        .custom-rbc .rbc-toolbar { 
          margin-bottom: 48px; 
          font-family: var(--font-heading); 
          display: flex; 
          align-items: flex-end; 
          justify-content: space-between;
          padding: 0;
          border-bottom: 2px solid var(--text);
          padding-bottom: 16px;
        }
        .custom-rbc .rbc-toolbar-label { 
          font-weight: 800; 
          font-size: 2.5rem; 
          color: var(--text); 
          text-transform: uppercase; 
          letter-spacing: -0.04em; 
          line-height: 1;
        }
        .custom-rbc .rbc-btn-group { display: flex; position: relative; z-index: 10; }
        .custom-rbc .rbc-btn-group button { 
          border-radius: 0; 
          border: none; 
          color: var(--muted); 
          font-weight: 600; 
          padding: 8px 16px; 
          transition: all 0.3s ease; 
          background: transparent; 
          text-transform: uppercase; 
          font-size: 12px; 
          letter-spacing: 0.1em; 
          position: relative;
          cursor: pointer;
        }
        .custom-rbc .rbc-btn-group button::after {
          content: '';
          position: absolute;
          bottom: -18px;
          left: 0;
          width: 100%;
          height: 2px;
          background: transparent;
          transition: background 0.3s ease;
        }
        .custom-rbc .rbc-btn-group button:hover { 
          color: var(--text); 
        }
        .custom-rbc .rbc-btn-group button.rbc-active { 
          color: var(--text); 
        }
        .custom-rbc .rbc-btn-group button.rbc-active::after {
          background: var(--text);
        }

        /* Container View */
        .custom-rbc .rbc-month-view, .custom-rbc .rbc-agenda-view, .custom-rbc .rbc-time-view { 
          border: none; 
          background: transparent; 
        }

        /* Month View Grid */
        .custom-rbc .rbc-month-row { 
          border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent); 
        }
        .custom-rbc .rbc-header { 
          padding: 0 0 16px 0; 
          font-weight: 700; 
          font-size: 11px; 
          color: var(--muted); 
          text-transform: uppercase; 
          letter-spacing: 0.15em; 
          border: none; 
          text-align: left;
        }
        .custom-rbc .rbc-day-bg { 
          border-left: 1px dotted color-mix(in srgb, var(--border) 50%, transparent); 
          transition: background-color 0.4s ease; 
        }
        .custom-rbc .rbc-day-bg:first-child { border-left: none; }
        .custom-rbc .rbc-day-bg:hover { 
          background-color: color-mix(in srgb, var(--surface) 30%, transparent); 
        }

        /* Date Cells */
        .custom-rbc .rbc-date-cell { 
          font-weight: 500; 
          font-size: 14px; 
          padding: 12px; 
          color: var(--text); 
          text-align: left;
          font-family: var(--font-heading);
        }
        
        /* Today Highlight */
        .custom-rbc .rbc-day-bg.rbc-today { 
          background-color: rgba(0,0,0,0.02) !important; 
        }
        .custom-rbc .rbc-now.rbc-date-cell > a,
        .custom-rbc .rbc-now.rbc-date-cell { 
          color: var(--accent) !important;
          font-weight: 800;
        }

        /* Off-range dates */
        .custom-rbc .rbc-off-range-bg { background-color: transparent; }
        .custom-rbc .rbc-off-range .rbc-date-cell { color: var(--muted); opacity: 0.3; }

        /* Events */
        .custom-rbc .rbc-event { 
          padding: 0; 
          outline: none; 
          background: transparent; 
        }
        .custom-rbc .premium-rbc-event {
          position: relative;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          background: color-mix(in srgb, var(--surface) 80%, transparent) !important;
        }
        .custom-rbc .premium-rbc-event::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: currentColor;
          opacity: 0.05;
          z-index: -1;
          transition: opacity 0.3s ease;
        }
        .custom-rbc .premium-rbc-event:hover { 
          transform: translateX(4px);
          z-index: 50;
        }
        .custom-rbc .premium-rbc-event:hover::before {
          opacity: 0.1;
        }

        /* Agenda View Styling */
        .custom-rbc .rbc-agenda-table thead > tr > th { 
          background: transparent; 
          color: var(--muted); 
          font-weight: 700; 
          padding: 16px 0; 
          font-size: 11px; 
          text-transform: uppercase; 
          border-bottom: 1px solid var(--border); 
          border-left: none; 
          text-align: left;
        }
        .custom-rbc .rbc-agenda-table tbody > tr > td { 
          padding: 16px 0; 
          border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent); 
          color: var(--text); 
          font-weight: 500; 
          font-size: 14px; 
        }
        .custom-rbc .rbc-agenda-date-cell { font-weight: 700; color: var(--text); }
        .custom-rbc .rbc-agenda-time-cell { color: var(--muted); }
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
        date={currentDate}
        onNavigate={(newDate) => setCurrentDate(newDate)}
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
