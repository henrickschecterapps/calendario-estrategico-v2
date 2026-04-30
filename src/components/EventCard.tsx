import { TriplaEvent } from "@/types/evento";
import { useEvents } from "@/store/useEvents";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock, Users, ChevronRight, Star, Briefcase, Tag, CalendarDays, User, MessageCircle } from "lucide-react";
import { parseEventStringDate, isEventPast } from "@/lib/dateUtils";
import { cn } from "../lib/utils";

export function getStatusInfo(status: string) {
  const s = status?.toLowerCase() || '';
  switch (s) {
    case "concluído": return { label: "Concluído", color: "text-purple bg-purple/15 border-purple/30", dot: "bg-purple" };
    case "confirmado": return { label: "Confirmado", color: "text-green bg-green/15 border-green/30", dot: "bg-green" };
    case "planejado": return { label: "Planejado", color: "text-accent bg-accent/15 border-accent/30", dot: "bg-accent" };
    case "cancelado": return { label: "Cancelado", color: "text-red bg-red/15 border-red/30", dot: "bg-red" };
    case "em negociação": return { label: "Em Negociação", color: "text-amber bg-amber/15 border-amber/30", dot: "bg-amber" };
    default: return { label: status || "—", color: "text-muted bg-muted/10 border-muted/20", dot: "bg-muted" };
  }
}

export function getTypeColor(tipo: string) {
  const t = tipo?.toLowerCase() || '';
  if (t.includes("patrocinado")) return "text-white bg-accent border-accent";
  if (t.includes("comercial")) return "text-white bg-brand-tang-blue border-brand-tang-blue";
  if (t === "interno") return "text-white bg-green border-green";
  if (t === "feriado") return "text-white bg-amber border-amber";
  return "text-muted bg-muted/10 border-muted/20";
}

function getTypeSoftColor(tipo: string) {
  const t = tipo?.toLowerCase() || '';
  if (t.includes("patrocinado")) return "bg-accent/[0.06] border-accent/15";
  if (t.includes("comercial")) return "bg-brand-tang-blue/[0.06] border-brand-tang-blue/15";
  if (t === "interno") return "bg-green/[0.06] border-green/15";
  if (t === "feriado") return "bg-amber/[0.06] border-amber/15";
  return "bg-muted/5 border-border";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-accent/20 text-accent",
    "bg-purple/20 text-purple",
    "bg-green/20 text-green",
    "bg-amber/20 text-amber",
    "bg-pink/20 text-pink",
    "bg-teal/20 text-teal",
    "bg-red/20 text-red",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getTemporalBadge(dataIni: string, dataFim: string): { label: string; color: string } | null {
  const start = parseEventStringDate(dataIni);
  if (!start) return null;
  const end = parseEventStringDate(dataFim) || start;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(start); s.setHours(0, 0, 0, 0);
  const e = new Date(end); e.setHours(0, 0, 0, 0);
  if (today >= s && today <= e) return { label: "Ao Vivo", color: "bg-green text-white shadow-sm shadow-green/30" };
  const diffDays = Math.ceil((s.getTime() - today.getTime()) / (1000 * 3600 * 24));
  if (diffDays > 0 && diffDays <= 7) return { label: `${diffDays} ${diffDays === 1 ? 'DIA' : 'DIAS'}`, color: "bg-text text-bg shadow-sm" };
  if (diffDays > 7 && diffDays <= 30) return { label: `${diffDays} ${diffDays === 1 ? 'DIA' : 'DIAS'}`, color: "bg-muted/15 text-muted border border-border" };
  return null;
}

function formatDateRange(dataIni: string, dataFim: string): string {
  const start = parseEventStringDate(dataIni);
  const end = parseEventStringDate(dataFim);
  if (!start) return "—";
  const startStr = format(start, "dd MMM", { locale: ptBR });
  if (!end || (end.getTime() === start.getTime())) return startStr;
  const endStr = format(end, "dd MMM", { locale: ptBR });
  return `${startStr} → ${endStr}`;
}

export default function EventCard({ event }: { event: TriplaEvent }) {
  const { setSelectedEvent } = useEvents();
  const past = isEventPast(event.data_ini, event.status);
  const badge = getTemporalBadge(event.data_ini, event.data_fim || event.data_ini);
  const status = getStatusInfo(event.status || '');

  const totalParticipants = (Number(event.vagas_staff) || 0) + (Number(event.vagas_cliente) || 0) + (Number(event.vagas_vip) || 0);
  const equipeCount = event.equipe?.length || 0;
  const respNames = event.responsavel?.split(',').map((r: string) => r.trim()).filter(Boolean) || [];

  return (
    <div 
      onClick={() => setSelectedEvent(event)}
      className={cn(
        "group relative bg-surface border border-border rounded-2xl cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden",
        "hover:shadow-2xl hover:shadow-accent/10 hover:-translate-y-1 hover:border-accent/40",
        past && "opacity-60 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"
      )}
    >
      <div className="flex items-stretch">
        {/* Left: Date column */}
        <div className={cn(
          "flex flex-col items-center justify-center px-2 py-4 w-[120px] sm:w-[140px] shrink-0 border-r border-border",
          getTypeSoftColor(event.tipo || '')
        )}>
          <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] leading-none">
            {format(parseEventStringDate(event.data_ini) || new Date(), 'EEE', { locale: ptBR })}
          </span>
          <span className="text-3xl font-black text-text leading-none mt-0.5">
            {format(parseEventStringDate(event.data_ini) || new Date(), 'dd')}
          </span>
          <span className="text-[11px] font-bold text-muted capitalize leading-none mt-1">
            {format(parseEventStringDate(event.data_ini) || new Date(), 'MMM', { locale: ptBR })}
          </span>
          <div className={cn(
            "mt-2 px-1.5 py-1 w-[95%] rounded-md text-[8px] font-semibold uppercase tracking-wider border leading-tight text-center",
            getTypeColor(event.tipo || '')
          )}>
            {event.tipo || "—"}
          </div>
        </div>

        {/* Center: 2-row content */}
        <div className="flex-1 min-w-0 py-4 px-5 flex flex-col justify-center gap-2">
          {/* Top row: title + badge + status */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <h3 className="text-base font-black text-text leading-tight group-hover:text-accent transition-colors truncate">
                {event.evento}
              </h3>
              {badge && (
                <span className={cn("shrink-0 px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider leading-none", badge.color, badge.label === "Ao Vivo" && "animate-pulse font-black")}>
                  {badge.label}
                </span>
              )}
            </div>
            <div className={cn("shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider", status.color)}>
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dot)} />
              {event.status}
            </div>
          </div>

          {/* Bottom row: details + avatars + metrics */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 xl:gap-4 mt-0.5">
            {/* Left details */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-muted/60" />
                <span className="text-[11px] md:text-xs font-semibold truncate max-w-[140px] md:max-w-[160px]">
                  {event.localidade || event.cidade || 'Local N/D'}
                </span>
              </div>
              <span className="text-border text-[10px] shrink-0">·</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5 text-muted/60" />
                <span className="text-[11px] md:text-xs font-semibold">
                  {event.hora_ini || '--:--'}{event.hora_fim ? `–${event.hora_fim}` : ''}
                </span>
              </div>
              {event.data_fim && event.data_fim !== event.data_ini && (
                <>
                  <span className="text-border text-[10px] shrink-0">·</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CalendarDays className="w-3.5 h-3.5 text-muted/60" />
                    <span className="text-[11px] md:text-xs font-semibold">{formatDateRange(event.data_ini, event.data_fim)}</span>
                  </div>
                </>
              )}
              {event.formato && (
                <>
                  <span className="text-border text-[10px] shrink-0">·</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Tag className="w-3.5 h-3.5 text-muted/60" />
                    <span className="text-[11px] md:text-xs font-semibold">{event.formato}</span>
                  </div>
                </>
              )}
            </div>

            {/* Right: Detailed Metrics & Avatars */}
            <div className="flex flex-wrap items-center gap-4 shrink-0 mt-2 xl:mt-0">
              
              {/* Vagas Breakdown */}
              {(!(event.tipo === 'Feriado' || event.tipo === 'Interno') || (event.arquivos && event.arquivos.length > 0)) && (
                <div className="flex items-center gap-3 bg-bg/50 px-3 py-1.5 rounded-lg border border-border shadow-sm">
                  {!(event.tipo === 'Feriado' || event.tipo === 'Interno') && (
                    <>
                      <div className="flex items-center gap-1.5" title="Staff Alocados">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="text-[11px] font-black text-text">{event.equipe?.length || 0} <span className="text-[9px] font-bold text-muted uppercase tracking-widest ml-0.5">Staff</span></span>
                      </div>
                      <div className="w-px h-3 bg-border" />
                      <div className="flex items-center gap-1.5" title="Clientes Confirmados">
                        <div className="w-1.5 h-1.5 rounded-full bg-green" />
                        <span className="text-[11px] font-black text-text">{event.clientes?.length || 0} <span className="text-[9px] font-bold text-muted uppercase tracking-widest ml-0.5">Cli</span></span>
                      </div>
                      <div className="w-px h-3 bg-border" />
                      <div className="flex items-center gap-1.5" title="VIPs Confirmados">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple" />
                        <span className="text-[11px] font-black text-text">{event.vips?.length || 0} <span className="text-[9px] font-bold text-muted uppercase tracking-widest ml-0.5">VIP</span></span>
                      </div>
                    </>
                  )}
                  
                  {/* Extra Docs Icon */}
                  {event.arquivos && event.arquivos.length > 0 && (
                    <>
                      {!(event.tipo === 'Feriado' || event.tipo === 'Interno') && <div className="w-px h-3 bg-border" />}
                      <div className="flex items-center gap-1 text-accent" title="Documentos Anexados">
                        <Star className="w-3.5 h-3.5 fill-accent" />
                        <span className="text-[11px] font-black">{event.arquivos.length}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Responsibles with Names */}
              <div className="flex items-center gap-2.5 min-w-[120px]">
                <div className="flex -space-x-2 shrink-0">
                  {respNames.length > 0 ? (
                    respNames.slice(0, 2).map((r, i) => (
                      <div 
                        key={i} 
                        title={r} 
                        className={cn(
                          "w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[9px] font-black shadow-sm",
                          getAvatarColor(r)
                        )}
                      >
                        {getInitials(r)}
                      </div>
                    ))
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted/10 border-2 border-surface flex items-center justify-center shadow-sm">
                      <User className="w-3.5 h-3.5 text-muted/40" />
                    </div>
                  )}
                </div>
                
                {respNames.length > 0 ? (
                  <div className="flex flex-col min-w-0">
                    <span 
                      className="text-[11px] font-bold text-text truncate max-w-[140px] xl:max-w-[220px]" 
                      title={respNames.join(', ')}
                    >
                      {respNames.join(', ')}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Sem Resp.</span>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex flex-col items-center justify-center px-4 border-l border-border gap-3 group-hover:border-accent/20 transition-colors relative">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              const { setEventForComments } = useEvents.getState();
              setEventForComments(event); 
            }}
            className="relative w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-accent hover:text-white hover:border-accent transition-all duration-200 text-muted shadow-sm hover:shadow-md hover:scale-105"
            title="Discutir Evento"
          >
            <MessageCircle className="w-4 h-4" />
            
            {event.comentarios && event.comentarios.length > 0 && (
              <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red text-white flex items-center justify-center text-[9px] font-black shadow-sm border-2 border-surface animate-in zoom-in">
                {event.comentarios.length}
              </div>
            )}
          </button>
          <div className="w-8 h-8 rounded-full bg-bg flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-200 text-muted">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

