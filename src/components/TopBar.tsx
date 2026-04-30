"use client";

import { useAuth } from "@/store/useAuth";
import { useEvents } from "@/store/useEvents";
import { useTheme } from "@/store/useTheme";
import { useToast } from "@/components/ToastProvider";
import { logout } from "@/lib/firebase";
import { exportICS } from "@/lib/eventActions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, LogOut, Download, Moon, Sun, Settings, X, Info, AlertTriangle, Calendar, Search, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "../lib/utils";

export default function TopBar() {
  const { user, isAdmin } = useAuth();
  const { events, searchQuery, setSearchQuery, setIsActivityModalOpen } = useEvents();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const [showNotifs, setShowNotifs] = useState(false);

  const notifications = [
    { id: 1, title: 'Evento Confirmado', body: 'O evento "CIO Meeting" foi alterado para confirmado.', time: '2h atrás', icon: <Info className="w-4 h-4 text-accent"/>, color: 'bg-accent/10 border-accent/20' },
    { id: 2, title: 'Estoque Baixo', body: 'O item "Brinde Mochila" atingiu o nível crítico.', time: '5h atrás', icon: <AlertTriangle className="w-4 h-4 text-amber"/>, color: 'bg-amber/10 border-amber/20' },
  ];

  const today = format(new Date(), "E., d 'de' MMM.", { locale: ptBR });

  const handleExportICS = () => {
    if (events.length === 0) {
      showToast("Nenhum evento para exportar.", "warning");
      return;
    }
    exportICS(events);
    showToast("Calendário exportado como .ics!", "success");
  };

  return (
    <header className="h-20 w-full bg-surface/90 backdrop-blur-xl sticky top-0 flex items-center justify-between px-4 md:px-10 flex-shrink-0 z-[60] border-b border-border transition-all duration-500">
      <div className="flex items-center gap-5 cursor-pointer group" onClick={() => router.push('/dashboard')}>
        <img 
          src="/logo.png" 
          alt="Tripla Eventos" 
          className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300" 
        />
      </div>

      <div className="flex-1 max-w-2xl mx-12 hidden md:block">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text"
            placeholder="Pesquisar por evento, local ou responsável..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg border-2 border-border/50 rounded-[18px] py-3.5 pl-14 pr-20 text-sm font-black focus:bg-surface focus:border-accent shadow-sm focus:shadow-xl focus:shadow-accent/5 transition-all outline-none text-text placeholder:text-muted/40 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-30 group-focus-within:opacity-100 transition-opacity">
            <kbd className="bg-surface border border-border text-[10px] font-black px-2 py-1 rounded-lg shadow-sm text-muted">⌘</kbd>
            <kbd className="bg-surface border border-border text-[10px] font-black px-2 py-1 rounded-lg shadow-sm text-muted">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Date Display */}
        <div className="hidden lg:flex px-5 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-[0.2em] text-muted border border-border bg-bg/50">
          {today}
        </div>

        <div className="w-[1px] h-8 bg-border mx-1 hidden lg:block" />

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className={cn(
              "relative p-3 rounded-2xl transition-all border border-transparent",
              showNotifs ? 'bg-text text-bg shadow-xl scale-110' : 'text-muted hover:text-text hover:bg-muted/10 hover:border-border'
            )}
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red rounded-full border-[3px] border-surface animate-pulse" />
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 mt-5 w-96 bg-surface border border-border rounded-[28px] shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
                <div className="p-6 border-b border-border flex items-center justify-between bg-bg/50">
                   <h3 className="text-[11px] font-black text-muted uppercase tracking-[0.2em]">Notificações Recentes</h3>
                   <span className="text-[10px] font-black bg-accent text-white px-3 py-1 rounded-full shadow-lg shadow-accent/20 uppercase tracking-widest">2 Novas</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                   {notifications.map(n => (
                     <div key={n.id} className="p-5 border-b border-border last:border-0 hover:bg-bg/40 transition-all cursor-pointer group">
                        <div className="flex gap-5">
                           <div className={`w-12 h-12 rounded-[18px] ${n.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-all border`}>
                              {n.icon}
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-black text-text group-hover:text-accent transition-colors leading-tight tracking-tight">{n.title}</p>
                              <p className="text-xs text-muted font-medium mt-1.5 leading-relaxed line-clamp-2">{n.body}</p>
                              <p className="text-[10px] text-muted/50 mt-3 font-black uppercase tracking-[0.1em]">{n.time}</p>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="p-5 bg-bg/50 text-center border-t border-border">
                   <button onClick={() => { setShowNotifs(false); setIsActivityModalOpen(true); }} className="text-[10px] font-black text-muted uppercase tracking-[0.2em] hover:text-accent transition-colors">Visualizar todo o histórico</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Activity Log */}
        <button 
          onClick={() => setIsActivityModalOpen(true)}
          className="p-3 rounded-2xl text-muted hover:text-text hover:bg-muted/10 border border-transparent hover:border-border transition-all"
          title="Registro de Atividades da Equipe"
        >
          <Activity className="w-6 h-6" />
        </button>

        {user && (
          <div className="hidden md:flex items-center gap-4 bg-bg p-2 rounded-[20px] border border-border shadow-sm">
            <div className="w-10 h-10 rounded-[14px] bg-surface shadow-sm border border-border flex items-center justify-center text-[11px] font-black text-accent uppercase">
               {user.email?.substring(0, 2)}
            </div>
            <div className="flex flex-col pr-3">
               <span className="text-xs font-black text-text leading-none tracking-tight">{user.email?.split('@')[0]}</span>
               <span className="text-[9px] font-black text-muted mt-1 uppercase tracking-widest">{isAdmin ? 'ADMINISTRADOR' : 'INTEGRANTE'}</span>
            </div>
            <button onClick={() => { logout(); router.push("/"); }} className="p-2.5 hover:bg-red/10 hover:text-red rounded-xl text-muted transition-all border border-transparent hover:border-red/20" title="Sair do sistema">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="w-[1px] h-8 bg-border mx-1" />

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-2xl text-muted hover:bg-muted/10 border border-transparent hover:border-border transition-all"
            title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            {theme === "dark" ? <Sun className="w-6 h-6 text-amber" /> : <Moon className="w-6 h-6" />}
          </button>

          {isAdmin && (
            <button 
              onClick={() => router.push('/admin')} 
              className="bg-text text-bg px-6 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-3 shadow-xl shadow-text/10 hover:shadow-text/20 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-text/10"
            >
              <Settings className="w-4 h-4" /> Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
