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
      className: "premium-rbc-event",
      style: {
        backgroundColor: `color-mix(in srgb, ${bg} 15%, transparent)`,
        borderRadius: "8px",
        color: bg,
        border: `1px solid color-mix(in srgb, ${bg} 30%, transparent)`,
        borderLeft: `4px solid ${bg}`,
        display: "block",
        fontSize: "10px",
        fontWeight: "900",
        padding: "4px 10px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        textTransform: "uppercase" as any,
        letterSpacing: "0.05em",
        marginTop: "3px",
        marginBottom: "3px",
      }
    };
  };

  return (
    <div className="h-full w-full bg-surface/40 backdrop-blur-3xl rounded-[32px] shadow-high-depth border border-white/20 p-4 sm:p-8 custom-rbc font-sans flex flex-col transition-all duration-500">
      <style dangerouslySetInnerHTML={{__html: `
        /* PREMIUM CALENDAR DESIGN */
        .custom-rbc { border: none; background: transparent; padding: 0; }
        
        /* Toolbar */
        .custom-rbc .rbc-toolbar { 
          margin-bottom: 32px; 
          font-family: var(--font-heading); 
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          padding: 0 8px;
        }
        .custom-rbc .rbc-toolbar-label { 
          font-weight: 900; 
          font-size: 1.75rem; 
          color: var(--text); 
          text-transform: capitalize; 
          letter-spacing: -0.03em; 
        }
        .custom-rbc .rbc-btn-group { display: flex; gap: 8px; }
        .custom-rbc .rbc-btn-group button { 
          border-radius: 12px; 
          border: 1px solid var(--border); 
          color: var(--muted); 
          font-weight: 800; 
          padding: 10px 20px; 
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); 
          background: var(--surface); 
          text-transform: uppercase; 
          font-size: 10px; 
          letter-spacing: 0.1em; 
          box-shadow: 0 2px 6px -1px rgba(0,0,0,0.02);
        }
        .custom-rbc .rbc-btn-group button:hover { 
          background: var(--bg); 
          color: var(--text); 
          transform: translateY(-2px);
          box-shadow: 0 4px 12px -2px rgba(0,0,0,0.05);
        }
        .custom-rbc .rbc-btn-group button.rbc-active { 
          background: var(--text); 
          color: var(--bg); 
          border-color: var(--text); 
          pointer-events: none; 
          box-shadow: 0 8px 20px -4px rgba(0,0,0,0.15);
        }

        /* Container View */
        .custom-rbc .rbc-month-view, .custom-rbc .rbc-agenda-view, .custom-rbc .rbc-time-view { 
          border-radius: 24px; 
          border: 1px solid var(--border); 
          overflow: hidden; 
          background: var(--surface); 
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
        }

        /* Month View Grid */
        .custom-rbc .rbc-month-row { border-top: 1px solid var(--border); }
        .custom-rbc .rbc-header { 
          padding: 16px 10px; 
          font-weight: 900; 
          font-size: 11px; 
          color: var(--muted); 
          text-transform: uppercase; 
          letter-spacing: 0.2em; 
          border-bottom: 1px solid var(--border); 
          border-left: none; 
          background: rgba(0,0,0,0.01);
        }
        .custom-rbc .rbc-day-bg { 
          border-left: 1px solid var(--border); 
          transition: background-color 0.4s ease; 
        }
        .custom-rbc .rbc-day-bg:hover { 
          background-color: var(--bg); 
        }

        /* Date Cells */
        .custom-rbc .rbc-date-cell { 
          font-weight: 800; 
          font-size: 13px; 
          padding: 12px 14px; 
          color: var(--text); 
        }
        
        /* Today Highlight */
        .custom-rbc .rbc-day-bg.rbc-today { 
          background-color: transparent !important; 
        }
        .custom-rbc .rbc-now.rbc-date-cell > a,
        .custom-rbc .rbc-now.rbc-date-cell { 
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          color: white !important;
          border-radius: 12px;
          min-width: 32px;
          height: 32px;
          margin-top: 8px;
          margin-right: 8px;
          box-shadow: 0 4px 12px -2px var(--accent);
        }

        /* Off-range dates */
        .custom-rbc .rbc-off-range-bg { background-color: rgba(0,0,0,0.015); }
        .custom-rbc .rbc-off-range .rbc-date-cell { color: var(--muted); opacity: 0.3; }

        /* Events */
        .custom-rbc .rbc-event { 
          padding: 0; 
          outline: none; 
          background: transparent; 
        }
        .custom-rbc .premium-rbc-event {
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .custom-rbc .premium-rbc-event:hover { 
          transform: translateY(-1px) scale(1.01);
          filter: brightness(1.1);
          z-index: 50;
        }

        /* Agenda View Styling */
        .custom-rbc .rbc-agenda-table thead > tr > th { 
          background: var(--bg); 
          color: var(--muted); 
          font-weight: 900; 
          padding: 16px; 
          font-size: 11px; 
          text-transform: uppercase; 
          border-bottom: 1px solid var(--border); 
          border-left: none; 
        }
        .custom-rbc .rbc-agenda-table tbody > tr > td { 
          padding: 16px; 
          border-top: 1px solid var(--border); 
          color: var(--text); 
          font-weight: 700; 
          font-size: 13px; 
        }
        .custom-rbc .rbc-agenda-date-cell { font-weight: 900; color: var(--text); }
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
