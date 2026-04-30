"use client";

import { useEvents } from "@/store/useEvents";
import { useAuth } from "@/store/useAuth";
import { useToast } from "@/components/ToastProvider";
import { X, Send, MessageCircle, Edit2, Trash2, MoreVertical, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Comentario } from "@/types/collections";

export default function CommentsPanel() {
  const { eventForComments, setEventForComments } = useEvents();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  useEffect(() => {
    if (!eventForComments) return;

    const db = getFirebaseDb();
    if (!db) return;

    // Real-time listener for comments on this event
    const unsubscribe = onSnapshot(doc(db, "eventos", eventForComments.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setComentarios(data.comentarios || []);
      }
    });

    return () => unsubscribe();
  }, [eventForComments]);

  if (!eventForComments) return null;

  const handleSend = async () => {
    if (!novoComentario.trim()) return;

    try {
      setLoading(true);
      const db = getFirebaseDb();
      if (!db) return;

      const newComm = {
        id: Date.now().toString(),
        autor: user?.email?.split('@')[0]?.replace('.', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Usuário',
        texto: novoComentario,
        data: new Date().toISOString()
      };

      const eventRef = doc(db, "eventos", eventForComments.id);
      const docSnap = await getDoc(eventRef);
      const existingComments = docSnap.exists() ? (docSnap.data().comentarios || []) : [];

      await updateDoc(eventRef, {
        comentarios: [...existingComments, newComm]
      });

      setNovoComentario("");
    } catch (err) {
      console.error(err);
      showToast("Erro ao enviar comentário", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Tem certeza que deseja apagar este comentário?")) return;
    try {
      setLoading(true);
      const db = getFirebaseDb();
      if (!db) return;
      
      const eventRef = doc(db, "eventos", eventForComments.id);
      const docSnap = await getDoc(eventRef);
      const existingComments = docSnap.exists() ? (docSnap.data().comentarios || []) : [];
      
      const updatedComments = existingComments.filter((c: any) => c.id !== commentId);
      await updateDoc(eventRef, { comentarios: updatedComments });
    } catch (err) {
      showToast("Erro ao apagar", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editCommentText.trim() || !editCommentId) return;
    try {
      setLoading(true);
      const db = getFirebaseDb();
      if (!db) return;
      
      const eventRef = doc(db, "eventos", eventForComments.id);
      const docSnap = await getDoc(eventRef);
      const existingComments = docSnap.exists() ? (docSnap.data().comentarios || []) : [];
      
      const updatedComments = existingComments.map((c: any) => 
        c.id === editCommentId ? { ...c, texto: editCommentText, editado: true } : c
      );
      
      await updateDoc(eventRef, { comentarios: updatedComments });
      setEditCommentId(null);
      setEditCommentText("");
    } catch (err) {
      showToast("Erro ao editar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-[400px] h-[550px] max-h-[85vh] bg-surface shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1)] z-[120] border border-border rounded-[24px] flex flex-col animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-sm">
              <MessageCircle className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-xs font-black text-text uppercase tracking-widest leading-tight">Discussão</h2>
              <p className="text-[10px] font-bold text-muted truncate max-w-[180px]">{eventForComments.evento}</p>
            </div>
          </div>
          <button 
            onClick={() => setEventForComments(null)}
            className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center hover:bg-muted/10 text-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-bg/50">
          {comentarios.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <MessageCircle className="w-12 h-12 text-muted mb-4" />
              <p className="text-sm font-bold text-muted">Nenhum comentário ainda.</p>
              <p className="text-[10px] uppercase tracking-widest mt-1">Seja o primeiro a iniciar a discussão!</p>
            </div>
          ) : (
            comentarios.map((c: any) => {
              const isMe = c.autor.toLowerCase() === (user?.email?.split('@')[0]?.replace('.', ' ')?.toLowerCase() || '');
              const isEditing = editCommentId === c.id;
              
              return (
                <div key={c.id} className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'} group`}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">{isMe ? 'Você' : c.autor}</span>
                    <span className="text-[9px] font-bold text-muted/60">
                      {format(new Date(c.data), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      {c.editado && " (Editado)"}
                    </span>
                  </div>
                  
                  <div className="relative flex items-center gap-2 max-w-[85%]">
                    {/* Botões de Ação para quem comentou */}
                    {isMe && !isEditing && (
                      <div className="absolute -left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button onClick={() => { setEditCommentId(c.id); setEditCommentText(c.texto); }} className="p-1.5 text-muted hover:text-accent bg-surface rounded-full shadow-sm border border-border">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-muted hover:text-red bg-surface rounded-full shadow-sm border border-border">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    <div className={`px-4 py-2.5 rounded-2xl w-full text-sm font-medium leading-relaxed ${isMe ? 'bg-accent text-white rounded-br-none shadow-md shadow-accent/20' : 'bg-surface border border-border text-text rounded-bl-none shadow-sm'}`}>
                      {isEditing ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <textarea 
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-lg p-2 text-xs outline-none focus:bg-white/30 resize-none min-h-[60px]"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setEditCommentId(null)} className="text-[10px] uppercase font-bold text-white/80 hover:text-white">Cancelar</button>
                            <button onClick={handleSaveEdit} className="bg-white text-accent px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all">Salvar</button>
                          </div>
                        </div>
                      ) : (
                        c.texto
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-surface">
          <div className="flex items-end gap-2 bg-bg/50 p-2 rounded-2xl border border-border focus-within:border-accent/50 focus-within:bg-surface transition-all">
            <textarea 
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] text-sm px-3 py-3 text-text placeholder:text-muted/60 custom-scrollbar"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!novoComentario.trim() || loading}
              className="w-11 h-11 shrink-0 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-hover disabled:opacity-50 disabled:hover:bg-accent transition-all shadow-md shadow-accent/20"
            >
              <Send className="w-5 h-5 -ml-1" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
