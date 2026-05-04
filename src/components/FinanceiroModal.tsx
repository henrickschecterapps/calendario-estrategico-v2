import { useState, useEffect } from "react";
import { TriplaEvent } from "@/types/evento";
import { InventoryItem, Viagem } from "@/types/collections";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { X, Save, DollarSign, Loader2, Edit2, Eye, Plus } from "lucide-react";

interface FinanceiroModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit: TriplaEvent | null;
  onSaved: () => void;
  inventario?: InventoryItem[];
  viagens?: Viagem[];
  onViewEvent?: () => void;
}

export default function FinanceiroModal({ isOpen, onClose, eventToEdit, onSaved, onViewEvent }: FinanceiroModalProps) {
  const [formData, setFormData] = useState({
    uf: "",
    tipo_financeiro: "",
    apuracao_finalizada: false,
    custo_real: "",
    previsao_pipe: "",
    previsao_fechamento: "",
    receita_estimada: "",
  });
  
  const [outrosCustos, setOutrosCustos] = useState<{ id: string; nome: string; valor: string }[]>([]);
  const [novoOutroCusto, setNovoOutroCusto] = useState({ nome: "", valor: "" });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && eventToEdit) {
      setFormData({
        uf: eventToEdit.uf || "",
        tipo_financeiro: eventToEdit.tipo_financeiro || "",
        apuracao_finalizada: eventToEdit.apuracao_finalizada || false,
        custo_real: typeof eventToEdit.custo_real === 'number' ? eventToEdit.custo_real.toFixed(2).replace('.',',') : String(eventToEdit.custo_real || ""),
        previsao_pipe: typeof eventToEdit.previsao_pipe === 'number' ? eventToEdit.previsao_pipe.toFixed(2).replace('.',',') : String(eventToEdit.previsao_pipe || ""),
        previsao_fechamento: typeof eventToEdit.previsao_fechamento === 'number' ? eventToEdit.previsao_fechamento.toFixed(2).replace('.',',') : String(eventToEdit.previsao_fechamento || ""),
        receita_estimada: typeof eventToEdit.receita_estimada === 'number' ? eventToEdit.receita_estimada.toFixed(2).replace('.',',') : String(eventToEdit.receita_estimada || ""),
      });
      setOutrosCustos(eventToEdit.outros_custos_lista?.map(c => ({
        ...c,
        valor: String(c.valor || "")
      })) || []);
    } else {
      setFormData({
        uf: "",
        tipo_financeiro: "",
        apuracao_finalizada: false,
        custo_real: "",
        previsao_pipe: "",
        previsao_fechamento: "",
        receita_estimada: "",
      });
      setOutrosCustos([]);
      setNovoOutroCusto({ nome: "", valor: "" });
    }
    setIsEditing(false);
  }, [isOpen, eventToEdit]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string | boolean) => {
    if (typeof value === 'string' && ['custo_real', 'previsao_pipe', 'previsao_fechamento', 'receita_estimada'].includes(field)) {
      const val = value.replace(/[^0-9.,]/g, '');
      setFormData(prev => ({ ...prev, [field]: val }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addOutroCusto = () => {
    if (!novoOutroCusto.nome || !novoOutroCusto.valor) return;
    setOutrosCustos(prev => [
      ...prev, 
      { 
        id: Date.now().toString(), 
        nome: novoOutroCusto.nome, 
        valor: novoOutroCusto.valor.replace(/[^0-9.,]/g, '') 
      }
    ]);
    setNovoOutroCusto({ nome: "", valor: "" });
  };

  const removeOutroCusto = (id: string) => {
    setOutrosCustos(prev => prev.filter(c => c.id !== id));
  };

  const parseBRValue = (val: string): number => {
    if (!val) return 0;
    // Remove dots (thousands separators) and replace comma (decimal separator) with dot
    const clean = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const handleSave = async () => {
    if (!eventToEdit) return;
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const ref = doc(db, "eventos", eventToEdit.id);
      
      const payload = {
        uf: formData.uf,
        tipo_financeiro: formData.tipo_financeiro,
        apuracao_finalizada: formData.apuracao_finalizada,
        custo_real: parseBRValue(formData.custo_real),
        previsao_pipe: parseBRValue(formData.previsao_pipe),
        previsao_fechamento: parseBRValue(formData.previsao_fechamento),
        receita_estimada: parseBRValue(formData.receita_estimada),
        outros_custos_lista: outrosCustos.map(c => ({
          ...c,
          valor: parseBRValue(c.valor)
        }))
      };

      await updateDoc(ref, payload);
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar os dados financeiros.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-medium text-text flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent"/> Gestão Financeira - {eventToEdit?.evento}
          </h3>
          <div className="flex items-center gap-3">
             {!isEditing && (
                <>
                  <button 
                    onClick={onViewEvent} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-md font-medium text-xs hover:bg-accent/20 transition-all uppercase tracking-widest text-accent"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver Evento
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md font-medium text-xs hover:bg-white/10 transition-all uppercase tracking-widest text-text"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                </>
             )}
            <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Readonly info */}
             <div className="flex flex-col gap-1.5 md:col-span-2">
                 <label className="text-sm font-medium text-muted uppercase tracking-wider">Evento</label>
                 <input type="text" value={eventToEdit?.evento || ""} disabled className="w-full bg-bg border border-white/5 rounded-md py-2 px-3 text-text/50 font-mono disabled:opacity-60" />
             </div>

             <div className="flex flex-col gap-1.5">
                 <label className="text-sm font-medium text-muted uppercase tracking-wider">Data</label>
                 <input type="text" value={eventToEdit?.data_ini || ""} disabled className="w-full bg-bg border border-white/5 rounded-md py-2 px-3 text-text/50 font-mono disabled:opacity-60" />
             </div>

             <div className="flex flex-col gap-1.5">
               <label className="text-sm font-medium text-muted uppercase tracking-wider">UF</label>
               <input 
                 type="text" 
                 value={formData.uf} 
                 onChange={e => handleChange('uf', e.target.value)}
                 className="w-full bg-bg border border-white/10 rounded-md py-2 px-3 outline-none text-text focus:border-accent transition-colors disabled:opacity-60 uppercase"
                 placeholder="Ex: SP, RJ..."
                 disabled={!isEditing}
                 maxLength={2}
               />
             </div>

             <div className="flex flex-col gap-1.5">
               <label className="text-sm font-medium text-muted uppercase tracking-wider">Tipo (Financeiro)</label>
               <select 
                 value={formData.tipo_financeiro} 
                 onChange={e => handleChange('tipo_financeiro', e.target.value)}
                 className="w-full bg-bg border border-white/10 rounded-md py-2 px-3 outline-none text-text focus:border-accent transition-colors disabled:opacity-60"
                 disabled={!isEditing}
               >
                 <option value="">Selecione...</option>
                 <option value="Happy Hour">Happy Hour</option>
                 <option value="Segmento">Segmento</option>
                 <option value="Regional">Regional</option>
                 <option value="Nacional">Nacional</option>
               </select>
             </div>

             <div className="flex flex-col gap-1.5">
               <label className="text-sm font-medium text-muted uppercase tracking-wider">Apuração Finalizada?</label>
               <select 
                 value={formData.apuracao_finalizada ? "Sim" : "Não"} 
                 onChange={e => handleChange('apuracao_finalizada', e.target.value === "Sim")}
                 className="w-full bg-bg border border-white/10 rounded-md py-2 px-3 outline-none text-text focus:border-accent transition-colors disabled:opacity-60"
                 disabled={!isEditing}
               >
                 <option value="Não">Não</option>
                 <option value="Sim">Sim</option>
               </select>
             </div>
          </div>

          <div className="h-px w-full bg-white/5 my-2"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'custo_real', label: 'Custo Real' },
              { id: 'previsao_pipe', label: 'Previsão de Pipe (x200)' },
              { id: 'previsao_fechamento', label: 'Previsão de Fechamento 15%' },
              { id: 'receita_estimada', label: 'Receita Líquida Estimada' },
            ].map((field) => (
              <div key={field.id} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted uppercase tracking-wider">{field.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">R$</span>
                  <input 
                    type="text" 
                    value={(formData as any)[field.id]} 
                    onChange={e => handleChange(field.id, e.target.value)}
                    className="w-full bg-bg border border-white/10 rounded-md py-2 pl-10 pr-3 outline-none text-text focus:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="0,00"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-white/5 my-4"></div>

          {/* Outros Custos */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-medium text-text uppercase tracking-widest flex items-center gap-2">Detalhamento de Itens</h4>
            
            <div className="space-y-3">
              {outrosCustos.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-bg border border-white/5 p-3 rounded-lg group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text">{c.nome}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-text font-mono">R$ {parseBRValue(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    {isEditing && (
                      <button onClick={() => removeOutroCusto(c.id)} className="text-red/60 hover:text-red transition-colors"><X className="w-4 h-4"/></button>
                    )}
                  </div>
                </div>
              ))}
              {outrosCustos.length === 0 && !isEditing && (
                 <div className="text-sm text-muted italic p-3 text-center border border-white/5 rounded-lg border-dashed">Nenhum item de custo detalhado.</div>
              )}
            </div>

            {isEditing && (
              <div className="flex flex-col md:flex-row gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                 <input 
                   type="text" 
                   placeholder="Item de custo (Ex: Consumo, Estacionamento)" 
                   value={novoOutroCusto.nome} 
                   onChange={e => setNovoOutroCusto(prev => ({...prev, nome: e.target.value}))}
                   className="flex-1 bg-bg text-text text-sm px-3 py-2 rounded-md border border-white/10 outline-none focus:border-accent transition-colors"
                 />
                 <div className="relative w-full md:w-32">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">R$</span>
                   <input 
                     type="text" 
                     placeholder="0,00" 
                     value={novoOutroCusto.valor} 
                     onChange={e => setNovoOutroCusto(prev => ({...prev, valor: e.target.value.replace(/[^0-9.,]/g, '')}))}
                     className="w-full bg-bg text-text text-sm pl-9 pr-3 py-2 rounded-md border border-white/10 outline-none focus:border-accent transition-colors"
                   />
                 </div>
                 <button 
                   onClick={addOutroCusto}
                   className="bg-accent text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20 flex items-center gap-1"
                 >
                   <Plus className="w-4 h-4"/> Add
                 </button>
              </div>
            )}
          </div>

        </div>

        <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-transparent text-text border border-white/10 rounded-md font-medium text-sm hover:bg-white/5 transition-colors"
          >
            {isEditing ? 'Cancelar' : 'Fechar'}
          </button>
          {isEditing && (
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="px-4 py-2 bg-accent text-white rounded-md font-medium text-sm hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              Salvar Financeiro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
