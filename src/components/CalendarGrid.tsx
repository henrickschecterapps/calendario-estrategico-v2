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
      if (!end) {
        end = new Date(start);
      }
      // Garante que o evento cubra o dia inteiro da data final
      end.setHours(23, 59, 59, 999);

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
        "--event-color": bg,
      } as React.CSSProperties
    };
  };

  return (
    <div className="h-full w-full bg-surface/40 backdrop-blur-3xl rounded-[32px] shadow-high-depth border border-white/20 p-4 sm:p-8 custom-rbc font-sans flex flex-col transition-all duration-500">
      <style dangerouslySetInnerHTML={{__html: `
        /* LUXURY MINIMALIST CALENDAR DESIGN */
        .custom-rbc { border: none; background: transparent; padding: 0; }
        
        /* Toolbar */
        .custom-rbc .rbc-toolbar { 
          margin-bottom: 32px; 
          font-family: var(--font-heading); 
          display: flex; 
          align-items: flex-end; 
          justify-content: space-between;
          padding: 0;
          border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
          padding-bottom: 24px;
        }
        .custom-rbc .rbc-toolbar-label { 
          font-weight: 700; 
          font-size: 2rem; 
          color: var(--text); 
          text-transform: capitalize; 
          letter-spacing: -0.02em; 
          line-height: 1;
        }
        .custom-rbc .rbc-btn-group { display: flex; position: relative; z-index: 10; gap: 8px; }
        .custom-rbc .rbc-btn-group button { 
          border-radius: 12px; 
          border: 1px solid transparent; 
          color: var(--muted); 
          font-weight: 500; 
          padding: 8px 16px; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          background: transparent; 
          text-transform: capitalize; 
          font-size: 13px; 
          letter-spacing: 0.02em; 
          cursor: pointer;
        }
        .custom-rbc .rbc-btn-group button:hover { 
          color: var(--text); 
          background: color-mix(in srgb, var(--surface) 50%, transparent);
        }
        .custom-rbc .rbc-btn-group button.rbc-active { 
          color: var(--text); 
          font-weight: 600;
          background: var(--surface);
          border-color: color-mix(in srgb, var(--border) 50%, transparent);
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        /* Container View */
        .custom-rbc .rbc-month-view, .custom-rbc .rbc-agenda-view, .custom-rbc .rbc-time-view { 
          border: none; 
          background: transparent; 
        }

        /* Month View Grid */
        .custom-rbc .rbc-month-row { 
          border-top: 1px solid color-mix(in srgb, var(--border) 40%, transparent); 
        }
        .custom-rbc .rbc-header { 
          padding: 16px 0; 
          font-weight: 600; 
          font-size: 12px; 
          color: var(--muted); 
          text-transform: uppercase; 
          letter-spacing: 0.05em; 
          border: none; 
          text-align: center;
        }
        .custom-rbc .rbc-day-bg { 
          border-left: 1px solid color-mix(in srgb, var(--border) 30%, transparent); 
          transition: background-color 0.3s ease; 
        }
        .custom-rbc .rbc-day-bg:first-child { border-left: none; }
        .custom-rbc .rbc-day-bg:hover { 
          background-color: color-mix(in srgb, var(--surface) 60%, transparent); 
        }

        /* Date Cells */
        .custom-rbc .rbc-date-cell { 
          font-weight: 500; 
          font-size: 13px; 
          padding: 8px; 
          color: var(--text); 
          text-align: right;
          font-family: var(--font-sans);
        }
        .custom-rbc .rbc-date-cell > a {
          display: inline-block;
          width: 28px;
          height: 28px;
          line-height: 28px;
          text-align: center;
          border-radius: 50%;
          transition: all 0.2s ease;
          color: inherit;
          text-decoration: none;
        }
        
        /* Today Highlight */
        .custom-rbc .rbc-day-bg.rbc-today { 
          background-color: color-mix(in srgb, var(--accent) 2%, transparent) !important; 
        }
        .custom-rbc .rbc-now.rbc-date-cell > a { 
          background-color: var(--accent);
          color: #ffffff !important;
          font-weight: 700;
          box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 40%, transparent);
        }

        /* Off-range dates */
        .custom-rbc .rbc-off-range-bg { background-color: transparent; }
        .custom-rbc .rbc-off-range .rbc-date-cell > a { color: var(--muted); opacity: 0.4; }

        /* Events */
        .custom-rbc .rbc-event { 
          padding: 0; 
          outline: none; 
          background: transparent; 
        }
        .custom-rbc .premium-rbc-event {
          position: relative;
          background-color: color-mix(in srgb, var(--event-color) 8%, transparent) !important;
          border: 1px solid color-mix(in srgb, var(--event-color) 20%, transparent) !important;
          border-left: 3px solid var(--event-color) !important;
          color: var(--text) !important;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          margin: 2px 4px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .custom-rbc .premium-rbc-event:hover { 
          background-color: var(--event-color) !important;
          color: #ffffff !important;
          border-color: var(--event-color) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px color-mix(in srgb, var(--event-color) 30%, transparent);
          z-index: 50;
        }

        /* Agenda View Styling */
        .custom-rbc .rbc-agenda-table thead > tr > th { 
          background: transparent; 
          color: var(--muted); 
          font-weight: 600; 
          padding: 16px 0; 
          font-size: 12px; 
          text-transform: capitalize; 
          border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent); 
          border-left: none; 
          text-align: left;
        }
        .custom-rbc .rbc-agenda-table tbody > tr > td { 
          padding: 16px 0; 
          border-top: 1px solid color-mix(in srgb, var(--border) 30%, transparent); 
          color: var(--text); 
          font-weight: 500; 
          font-size: 14px; 
        }
        .custom-rbc .rbc-agenda-date-cell { font-weight: 600; color: var(--text); }
        .custom-rbc .rbc-agenda-time-cell { color: var(--muted); }
        /* Popup Overlay (More Events) */
        .custom-rbc .rbc-overlay {
          background: color-mix(in srgb, var(--surface) 95%, transparent);
          backdrop-filter: blur(16px);
          border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          padding: 12px;
          z-index: 100;
        }
        .custom-rbc .rbc-overlay-header {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          padding: 4px 8px 8px 8px;
          margin-bottom: 8px;
          border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
        }
        .custom-rbc .rbc-show-more {
          color: var(--accent);
          font-weight: 700;
          font-size: 11px;
          background: transparent;
          border: none;
          padding: 6px 8px;
          margin: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 6px;
          width: calc(100% - 8px);
          text-align: left;
        }
        .custom-rbc .rbc-show-more:hover {
          color: var(--text);
          background: color-mix(in srgb, var(--surface) 80%, transparent);
        }
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
        popup={true}
        messages={{
          today: 'Hoje',
          previous: 'Anterior',
          next: 'Próximo',
          month: 'Mês',
          week: 'Semana',
          day: 'Dia',
          agenda: 'Lista',
          noEventsInRange: 'Não há eventos neste período.',
          showMore: (count) => `+ ${count} mais`
        }}
      />
    </div>
  );
}
