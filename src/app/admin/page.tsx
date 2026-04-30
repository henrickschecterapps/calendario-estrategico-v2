"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

import { useAuth } from "@/store/useAuth";
import { useEvents } from "@/store/useEvents";
import TopBar from "@/components/TopBar";
import { 
  LayoutDashboard, 
  Calendar, 
  Box, 
  Settings, 
  Users, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Download, 
  AlertTriangle,
  Package,
  Shirt,
  Search,
  Plus,
  Trash2,
  Edit2,
  Flag,
  User,
  Star,
  Plane,
  PieChart,
  UploadCloud, 
  FolderUp, 
  Lock, 
  Save, 
  AlertCircle, 
  ShieldAlert,
  Users2,
  Building2,
  BarChart3,
  X,
  UserPlus,
  Loader2
} from "lucide-react";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip as ChartTooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title 
} from 'chart.js';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  ChartTooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title
);

import { getFirebaseDb, getFirebaseAuth, registerWithEmail } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, writeBatch, serverTimestamp, addDoc, setDoc } from "firebase/firestore";
import { deleteUser as firebaseDeleteUser } from "firebase/auth";
import InventoryModal from "@/components/InventoryModal";
import ViagemModal from "@/components/ViagemModal";
import ParticipanteModal from "@/components/ParticipanteModal";
import EventFormModal from "@/components/EventFormModal";
import PedidoModal from "@/components/PedidoModal";
import KanbanBoard from "@/components/KanbanBoard";
import EventModal from "@/components/EventModal";
import { formatToBRDate } from "@/lib/dateUtils";
import { useTheme } from "@/store/useTheme";
import { cn } from "@/lib/utils";
import { genericConverter } from "@/lib/firebaseUtils";
import { 
  InventoryItem, 
  Fornecedor, 
  Viagem, 
  Participante, 
  AppUser,
  PendingUser, 
  Organizador 
} from "@/types/collections";
import { TriplaEvent } from "@/types/evento";

type AdminTab = 'Dashboard' | 'Eventos' | 'Operacional' | 'Relatórios' | 'Usuarios' | 'Configuracoes';
type OperationalTab = 'Visão Geral' | 'Estoque' | 'Pedidos de Compra' | 'Fornecedores' | 'Viagens' | 'Participantes';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { events, fetchEvents } = useEvents(); 


  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [opTab, setOpTab] = useState<OperationalTab>('Visão Geral');
  
  const [inventario, setInventario] = useState<InventoryItem[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'brinde' | 'uniforme' | 'estoque' | 'fornecedor'>('estoque');
  const [editingItem, setEditingItem] = useState<(InventoryItem & Fornecedor) | null>(null);

  const [pedidoModalOpen, setPedidoModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<InventoryItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [viagemModalOpen, setViagemModalOpen] = useState(false);
  const [editingViagem, setEditingViagem] = useState<Viagem | null>(null);

  const [participanteModalOpen, setParticipanteModalOpen] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TriplaEvent | null>(null);

  // Vagas Modal
  const [vagasModalOpen, setVagasModalOpen] = useState(false);
  const [vagasModalType, setVagasModalType] = useState<'staff' | 'cliente' | 'vip'>('staff');

  // Operacional Lists Modal
  const [opModalOpen, setOpModalOpen] = useState(false);
  const [opModalData, setOpModalData] = useState<{ title: string, type: string, list: any[] }>({ title: '', type: '', list: [] });

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [organizadores, setOrganizadores] = useState<Organizador[]>([]);
  const [novoOrgName, setNovoOrgName] = useState("");
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({ almoxarifado: '', brindes: '', uniformes: '', fornecedores: '', viagens: '', participantes: '', usuarios: '' });
  const [draggingItem, setDraggingItem] = useState<{ id: string, type: 'brinde' | 'uniforme' } | null>(null);

  // Usuários Management State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserNome, setNewUserNome] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<'approved' | 'admin'>('approved');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState("");
  const [deleteUserLoading, setDeleteUserLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchInventory(); // For Dashboard metrics
    if (activeTab === 'Operacional') {
      fetchFornecedores();
      fetchViagens();
      fetchParticipantes();
    }
    if (activeTab === 'Configuracoes') {
      fetchConfigData();
    }
    if (activeTab === 'Usuarios') {
      fetchAllUsers();
    }
  }, [activeTab, fetchEvents]);

  const fetchConfigData = async () => {
    try {
      const db = getFirebaseDb();
      const usersSnap = await getDocs(collection(db, "users").withConverter(genericConverter<PendingUser>()));
      setPendingUsers(usersSnap.docs.map(d => d.data()).filter(u => u.role === 'pending'));

      const orgsSnap = await getDocs(collection(db, "responsaveis").withConverter(genericConverter<Organizador>()));
      setOrganizadores(orgsSnap.docs.map(d => d.data()));
    } catch(err) { console.error(err); }
  };

  const fetchAllUsers = useCallback(async () => {
    try {
      const db = getFirebaseDb();
      const usersSnap = await getDocs(collection(db, "users").withConverter(genericConverter<AppUser>()));
      setAllUsers(usersSnap.docs.map(d => d.data()));
    } catch(err) { console.error(err); }
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(getFirebaseDb(), "users", userId), { role: newRole });
      fetchAllUsers();
      fetchConfigData();
    } catch(e) { console.error(e); }
  };

  const deleteUserDoc = async (userId: string) => {
    if(!confirm("Deseja realmente remover este usuário? Esta ação é irreversível.")) return;
    setDeleteUserLoading(userId);
    try {
      await deleteDoc(doc(getFirebaseDb(), "users", userId));
      fetchAllUsers();
      fetchConfigData();
    } catch(e) { console.error(e); }
    setDeleteUserLoading(null);
  };

  const handleAddUser = async () => {
    setAddUserError("");
    if (!newUserEmail.trim() || !newUserNome.trim() || !newUserPassword.trim()) {
      setAddUserError("Preencha todos os campos.");
      return;
    }
    if (newUserPassword.length < 6) {
      setAddUserError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setAddUserLoading(true);
    try {
      // Use registerWithEmail which creates both Auth user and Firestore doc
      // Then update the role since registerWithEmail creates with 'pending'
      await registerWithEmail(newUserEmail.trim(), newUserPassword, newUserNome.trim());
      
      // Find the newly created user doc by email and update role
      const db = getFirebaseDb();
      const usersSnap = await getDocs(collection(db, "users"));
      const newUserDoc = usersSnap.docs.find(d => d.data().email === newUserEmail.trim());
      if (newUserDoc) {
        await updateDoc(doc(db, "users", newUserDoc.id), { role: newUserRole });
      }

      setAddUserModalOpen(false);
      setNewUserEmail("");
      setNewUserNome("");
      setNewUserPassword("");
      setNewUserRole('approved');
      fetchAllUsers();
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setAddUserError("Este e-mail já está cadastrado.");
      } else {
        setAddUserError("Erro ao criar usuário. Tente novamente.");
      }
    }
    setAddUserLoading(false);
  };

  const filteredGeneral = inventario.filter(i => 
    (i.nome || '').toLowerCase().includes(searchTerms.almoxarifado.toLowerCase()) || 
    (i.descricao || '').toLowerCase().includes(searchTerms.almoxarifado.toLowerCase())
  );

  const approveUser = async (userId: string) => {
    try {
      await updateDoc(doc(getFirebaseDb(), "users", userId), { role: 'approved' });
      fetchConfigData();
    } catch(e) {}
  };

  const addOrganizador = async () => {
    if(!novoOrgName.trim()) return;
    try {
      await addDoc(collection(getFirebaseDb(), "responsaveis"), { nome: novoOrgName.trim() });
      setNovoOrgName("");
      fetchConfigData();
    } catch(e) {}
  };

  const deleteOrganizador = async (id: string) => {
    if(!confirm("Remover este organizador padrão?")) return;
    try {
      await deleteDoc(doc(getFirebaseDb(), "responsaveis", id));
      fetchConfigData();
    } catch(e) {}
  };

  const fetchInventory = async () => {
    try {
      const db = getFirebaseDb();
      const [snapInv, snapBri, snapUni, snapEst, snapPed] = await Promise.all([
          getDocs(collection(db, "inventario").withConverter(genericConverter<InventoryItem>())),
          getDocs(collection(db, "brindes").withConverter(genericConverter<InventoryItem>())),
          getDocs(collection(db, "uniformes").withConverter(genericConverter<InventoryItem>())),
          getDocs(collection(db, "estoque").withConverter(genericConverter<InventoryItem>())),
          getDocs(collection(db, "pedidos").withConverter(genericConverter<InventoryItem>()))
        ]);

        const items: InventoryItem[] = [];
        
        const normalizeItem = (data: any, coll: string, defaultTipo?: string) => {
          // Broad fallbacks for different naming conventions in the database
          const nome = data.nome || data.item || data.brinde || data.nome_brinde || data.produto || 'Sem Nome';
          const quantidade = Number(data.quantidade ?? data.qtd ?? data.saldo ?? data.estoque ?? 0);
          const preco = data.preco || data.valor || data.vlr_unit || data.preco_unitario || '0,00';
          const nivel = data.nivel || (data.vip ? 'VIP' : 'Qualificacao');
          
          return {
            ...data,
            id: data.id,
            _collection: coll,
            tipo: data.tipo || defaultTipo,
            nome,
            quantidade,
            preco,
            nivel,
            status: data.status || (coll === 'uniformes' ? 'Pedido' : 'Cotacao')
          };
        };

        snapInv.forEach(doc => items.push(normalizeItem(doc.data(), 'inventario')));
        snapBri.forEach(doc => items.push(normalizeItem(doc.data(), 'brindes', 'brinde')));
        snapUni.forEach(doc => items.push(normalizeItem(doc.data(), 'uniformes', 'uniforme')));
        snapEst.forEach(doc => items.push(normalizeItem(doc.data(), 'estoque', 'estoque')));
        snapPed.forEach(doc => items.push(normalizeItem(doc.data(), 'pedidos')));

      setInventario(items);
    } catch (err) {
      console.error("Erro ao carregar inventário:", err);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const db = getFirebaseDb();
      const snap = await getDocs(collection(db, "fornecedores").withConverter(genericConverter<Fornecedor>()));
      setFornecedores(snap.docs.map(d => d.data()));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchViagens = async () => {
    try {
      const db = getFirebaseDb();
      const snap = await getDocs(collection(db, "viagens").withConverter(genericConverter<Viagem>()));
      setViagens(snap.docs.map(d => d.data()));
    } catch (err) { console.error(err); }
  };

  const fetchParticipantes = async () => {
    try {
      const db = getFirebaseDb();
      const snap = await getDocs(collection(db, "participantes").withConverter(genericConverter<Participante>()));
      setParticipantes(snap.docs.map(d => d.data()));
    } catch (err) { console.error(err); }
  };

  const openForm = (tipo: 'brinde' | 'uniforme' | 'estoque' | 'fornecedor', item: any = null) => {
     setModalTipo(tipo);
     setEditingItem(item);
     setModalOpen(true);
  };

  const handleUpdateQuantity = async (item: any, delta: number) => {
     const newQty = (Number(item.quantidade) || 0) + delta;
     if (newQty < 0) return;
     try {
       const db = getFirebaseDb();
       await updateDoc(doc(db, item._collection || "inventario", item.id), { quantidade: newQty });
       fetchInventory();
     } catch (err) {
       console.error(err);
     }
  };

  const handleDeleteItem = async (col: string, id: string, label: string) => {
     if (confirm(`Deseja realmente remover este ${label}?`)) {
       try {
         const db = getFirebaseDb();
         await deleteDoc(doc(db, col, id));
         if (col === 'inventario' || col === 'brindes' || col === 'uniformes' || col === 'estoque') fetchInventory();
         if (col === 'fornecedores') fetchFornecedores();
         if (col === 'viagens') fetchViagens();
         if (col === 'participantes') fetchParticipantes();
       } catch (err) {
         console.error(err);
       }
     }
  };

  const onDragStart = (e: React.DragEvent, id: string, type: 'brinde' | 'uniforme') => {
     setDraggingItem({ id, type });
     e.dataTransfer.setData('itemId', id);
  };

  const onDrop = async (e: React.DragEvent, newStatus: string, type: 'brinde' | 'uniforme') => {
     e.preventDefault();
     if (!draggingItem || draggingItem.type !== type) return;
     try {
       const db = getFirebaseDb();
       await updateDoc(doc(db, draggingItem.type === 'brinde' ? "brindes" : "uniformes", draggingItem.id), { status: newStatus });
       fetchInventory();
     } catch (err) {
       console.error(err);
     }
     setDraggingItem(null);
  };

  // ---------------- MÉTRICAS DASHBOARD ----------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureEvents = events.filter(e => {
    if (!e.data_ini) return false;
    const d = new Date(e.data_ini); d.setHours(0,0,0,0);
    return d >= today;
  });

  const totalEventosFuturos = futureEvents.length;
  const comercialInterno = futureEvents.filter(e => e.tipo === 'Comercial Interno').length;
  const comercialPatrocinado = futureEvents.filter(e => e.tipo === 'Comercial Patrocinado').length;
  const confirmados = futureEvents.filter(e => e.status === 'Confirmado').length;
  const concluidos = events.filter(e => e.status === 'Concluído').length;

  // Vagas abertas (apenas eventos futuros)
  const vagasStaffTotal = futureEvents.reduce((acc, e) => acc + (Number(e.vagas_staff) || 0), 0);
  const vagasClienteTotal = futureEvents.reduce((acc, e) => acc + (Number(e.vagas_cliente) || 0), 0);
  const vagasVipTotal = futureEvents.reduce((acc, e) => acc + (Number(e.vagas_vip) || 0), 0);

  const eventosComVagasStaff = futureEvents.filter(e => (Number(e.vagas_staff) || 0) > 0).sort((a,b) => new Date(a.data_ini||0).getTime() - new Date(b.data_ini||0).getTime());
  const eventosComVagasCliente = futureEvents.filter(e => (Number(e.vagas_cliente) || 0) > 0).sort((a,b) => new Date(a.data_ini||0).getTime() - new Date(b.data_ini||0).getTime());
  const eventosComVagasVip = futureEvents.filter(e => (Number(e.vagas_vip) || 0) > 0).sort((a,b) => new Date(a.data_ini||0).getTime() - new Date(b.data_ini||0).getTime());

  const vagasEventList = vagasModalType === 'staff' ? eventosComVagasStaff : vagasModalType === 'cliente' ? eventosComVagasCliente : eventosComVagasVip;
  const vagasFieldKey = vagasModalType === 'staff' ? 'vagas_staff' : vagasModalType === 'cliente' ? 'vagas_cliente' : 'vagas_vip';

  const monthStats = Array(12).fill(0);
  const tipoStats = { comercial: 0, comercialInterno: 0, comercialPatrocinado: 0, interno: 0, feriado: 0 };
  const orgMap: Record<string, number> = {};

  events.forEach(e => {
     if (e.data_ini) {
        const d = new Date(e.data_ini);
        const currentYear = new Date().getFullYear();
        if (d.getFullYear() === currentYear) monthStats[d.getMonth()]++;
     }
     if (e.tipo === 'Comercial') tipoStats.comercial++;
     else if (e.tipo === 'Comercial Interno') tipoStats.comercialInterno++;
     else if (e.tipo === 'Comercial Patrocinado') tipoStats.comercialPatrocinado++;
     else if (e.tipo === 'Interno') tipoStats.interno++;
     else if (e.tipo === 'Feriado') tipoStats.feriado++;
     
     if (e.responsavel) {
          e.responsavel.split(',').forEach(r => {
              const org = r.trim();
              if (org) orgMap[org] = (orgMap[org] || 0) + 1;
          });
     }
  });

  const orgStats = Object.entries(orgMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

  const eventosComVagas = futureEvents
      .filter(e => {
         const sum = (Number(e.vagas_cliente)||0) + (Number(e.vagas_staff)||0) + (Number(e.vagas_vip)||0);
         return sum > 0 && e.status !== 'Cancelado';
      })
      .sort((a,b) => new Date(a.data_ini || 0).getTime() - new Date(b.data_ini || 0).getTime());

  const estoqueBaixo = inventario.filter(i => (i.quantidade || 0) < 10 && i._collection === 'estoque').length;
  
  // Mapear métricas de brindes solicitadas
  const brindesData = inventario.filter(i => i.tipo === 'brinde' && i._collection === 'estoque');
  const qtdTotalBrindes = brindesData.reduce((acc, b) => acc + (b.quantidade || 0), 0);
  
  // Brindes que não estão alocados em eventos
  const allAlocadosIds = new Set();
  let qtdBrindesAlocadosFuturo = 0;
  const listBrindesAlocadosFuturo: any[] = [];
  let qtdBrindesEntregues = 0;
  const listBrindesEntregues: any[] = [];
  
  let equipeEmEventosFuturos = 0;
  let equipeEmCampoHoje = 0;

  events.forEach(e => {
     if (e.status !== 'Cancelado') {
         let isFuture = false;
         let isToday = false;
         if (e.data_ini) {
             const d = new Date(e.data_ini); d.setHours(0,0,0,0);
             const todayDate = new Date(); todayDate.setHours(0,0,0,0);
             if (d > todayDate) isFuture = true;
             else if (d.getTime() === todayDate.getTime()) isToday = true;
         }
         
         const isConcluido = e.status === 'Concluído';
         
         if (e.brindes_alocados && e.brindes_alocados.length > 0) {
             e.brindes_alocados.forEach(b => {
                 allAlocadosIds.add(b.id || b.docId);
                 if (isConcluido) {
                     qtdBrindesEntregues += (Number(b.qtd) || 0);
                     listBrindesEntregues.push({ evento: e.evento, item: b.item, qtd: b.qtd });
                 } else if (isFuture || isToday) {
                     qtdBrindesAlocadosFuturo += (Number(b.qtd) || 0);
                     listBrindesAlocadosFuturo.push({ evento: e.evento, item: b.item, qtd: b.qtd });
                 }
             });
         }
         
         if (isFuture || isToday) {
             equipeEmEventosFuturos += (e.equipe?.length || 0);
             if (isToday) {
                 equipeEmCampoHoje += (e.equipe?.length || 0);
             }
         }
     }
  });

  const listBrindesBaixoEstoque = brindesData.filter(b => (b.quantidade || 0) < 5 && !allAlocadosIds.has(b.id));
  const numBrindesBaixoEstoque = listBrindesBaixoEstoque.length;

  const numParticipantesCadastrados = participantes.length;

  const pedidosPendentesList = inventario.filter(i => i.status?.toUpperCase().includes('PEDIDO') || i.status?.toUpperCase().includes('COTACAO'));
  const pedidosPendentes = pedidosPendentesList.length;

  const totalBrindes = brindesData.length;
  const custoTotalBrindes = brindesData.reduce((acc, b) => {
    const p = typeof b.preco === 'string' ? parseFloat(b.preco.replace(',', '.')) : (Number(b.preco) || 0);
    return acc + (p * (b.quantidade || 0));
  }, 0);
  const totalBrindesVip = brindesData.filter(b => b.vip || b.descricao?.toLowerCase().includes('vip')).length;

  const uniformesData = inventario.filter(i => i.tipo === 'uniforme');
  const totalUniformesPedidos = uniformesData.filter(u => u.status?.toUpperCase().includes('PEDIDO')).length;
  const qtdTotalUniformes = uniformesData.reduce((acc, u) => acc + (u.quantidade || 0), 0);
  const custoTotalUniformes = uniformesData.reduce((acc, u) => {
    const p = typeof u.preco === 'string' ? parseFloat(u.preco.replace(',', '.')) : (Number(u.preco) || 0);
    return acc + (p * (u.quantidade || 0));
  }, 0);
  const totalUniformesEntregues = uniformesData.filter(u => u.status?.toUpperCase().includes('ENTREGUE')).length;

  const searchTermBrindes = (searchTerms.brindes || '').toLowerCase();
  const filteredBrindes = brindesData.filter(b => (b.nome || '').toLowerCase().includes(searchTermBrindes));

  const searchTermUniformes = (searchTerms.uniformes || '').toLowerCase();
  const filteredUniformes = uniformesData.filter(u => (u.nome || '').toLowerCase().includes(searchTermUniformes));

  const searchTermFornecedores = (searchTerms.fornecedores || '').toLowerCase();
  const filteredFornecedores = fornecedores.filter(f => (f.nome || '').toLowerCase().includes(searchTermFornecedores));

  const searchTermViagens = (searchTerms.viagens || '').toLowerCase();
  const filteredViagens = viagens.filter(v => (v.trecho || '').toLowerCase().includes(searchTermViagens) || (v.passageiro || '').toLowerCase().includes(searchTermViagens));

  const searchTermParticipantes = (searchTerms.participantes || '').toLowerCase();
  const filteredParticipantes = participantes.filter(p => (p.nome || '').toLowerCase().includes(searchTermParticipantes) || (p.email || '').toLowerCase().includes(searchTermParticipantes));

  const heatmapData = useMemo(() => {
    const cells: number[] = new Array(280).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    events.forEach(e => {
      if (!e.data_ini) return;
      const d = new Date(e.data_ini);
      d.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 3600 * 24));
      if (diff >= 0 && diff < 280) cells[279 - diff]++;
    });
    return cells;
  }, [events]);

  const renderGithubGraph = () => {
    const maxVal = Math.max(...heatmapData, 1);
    return (
      <div className="flex gap-1 overflow-x-auto pb-4 custom-scrollbar">
        {Array.from({length: 40}).map((_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
             {Array.from({length: 7}).map((_, dayIdx) => {
               const cellIndex = weekIdx * 7 + dayIdx;
               const val = heatmapData[cellIndex] || 0;
               const ratio = val / maxVal;
               let bg = 'bg-muted/10';
               if (ratio > 0.75) bg = 'bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.4)]';
               else if (ratio > 0.5) bg = 'bg-accent/70';
               else if (ratio > 0.25) bg = 'bg-accent/40';
               else if (ratio > 0) bg = 'bg-accent/20';
               return (
                 <div key={dayIdx} className={cn("w-5 h-5 rounded-sm transition-all hover:scale-125 cursor-help", bg)} title={`${val} evento(s)`}></div>
               );
             })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col font-sans overflow-hidden text-text relative z-0">
      {/* Antigravity Deep Spatial Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(var(--accent-rgb),0.08)_0%,transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.08)_0%,transparent_60%)]" />
      <TopBar />
      
      {/* Modals */}
      <InventoryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} tipo={modalTipo as any} itemToEdit={editingItem} onSaved={() => { if (modalTipo === 'fornecedor') fetchFornecedores(); else fetchInventory(); }} />
      <PedidoModal isOpen={pedidoModalOpen} onClose={() => setPedidoModalOpen(false)} itemToEdit={editingPedido} onSaved={fetchInventory} />
      <ViagemModal isOpen={viagemModalOpen} onClose={() => setViagemModalOpen(false)} itemToEdit={editingViagem} onSaved={fetchViagens} />
      <ParticipanteModal isOpen={participanteModalOpen} onClose={() => setParticipanteModalOpen(false)} itemToEdit={editingParticipante} onSaved={fetchParticipantes} />
      <EventFormModal isOpen={eventModalOpen} onClose={() => setEventModalOpen(false)} eventToEdit={editingEvent} onSaved={fetchEvents} />
      
      {/* Vagas Modal */}
      {vagasModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <h3 className="text-lg font-medium text-text">Vagas Abertas - {vagasModalType.toUpperCase()}</h3>
                <button onClick={() => setVagasModalOpen(false)} className="text-muted hover:text-text"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col gap-2">
                {vagasEventList.length > 0 ? vagasEventList.map(evt => (
                  <div 
                    key={evt.id} 
                    onClick={() => { setVagasModalOpen(false); setEditingEvent(evt); setEventModalOpen(true); }}
                    className="flex justify-between items-center p-3 rounded-lg border border-white/5 hover:border-white/20 hover:bg-white/5 cursor-pointer transition-all group"
                  >
                     <div>
                        <div className="text-sm font-medium text-text group-hover:text-accent transition-colors">{evt.evento}</div>
                        <div className="text-xs text-muted font-mono uppercase mt-1">{formatToBRDate(evt.data_ini)}</div>
                     </div>
                     <div className="text-lg font-bold text-accent">
                        {evt[vagasFieldKey] || 0}
                     </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted font-mono uppercase text-sm">Nenhuma vaga aberta</div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Operacional Lists Modal */}
      {opModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <h3 className="text-lg font-medium text-text">{opModalData.title}</h3>
                <button onClick={() => setOpModalOpen(false)} className="text-muted hover:text-text"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col gap-2">
                {opModalData.list.length > 0 ? opModalData.list.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-white/5">
                     <div>
                        <div className="text-sm font-medium text-text">{item.nome || item.item}</div>
                        {item.evento && <div className="text-xs text-muted font-mono uppercase mt-1">Evento: {item.evento}</div>}
                        {item.status && <div className="text-xs text-muted font-mono uppercase mt-1">Status: {item.status}</div>}
                     </div>
                     <div className="text-lg font-bold text-accent">
                        {item.quantidade || item.qtd || 0}
                     </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted font-mono uppercase text-sm">Nenhum item encontrado</div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Admin Dense Command Center */}
      <div className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-white/5 pt-3 pb-3 px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 max-w-[1400px] mx-auto w-full">
          
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_8px_var(--accent)]" />
             <span className="text-sm font-semibold text-text uppercase tracking-widest">Tripla System</span>
          </div>
          
          <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-white/5">
            {[
              { id: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5"/>, label: 'Resumo' },
              { id: 'Eventos', icon: <Calendar className="w-5 h-5"/>, label: 'Eventos' },
              { id: 'Operacional', icon: <Box className="w-5 h-5"/>, label: 'Operacional' },
              { id: 'Relatórios', icon: <PieChart className="w-5 h-5"/>, label: 'Analytics' },
              { id: 'Usuarios', icon: <Users className="w-5 h-5"/>, label: 'Usuários' },
              { id: 'Configuracoes', icon: <Settings className="w-5 h-5"/>, label: 'Config' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === tab.id ? 'text-text bg-white/5 shadow-sm' : 'text-muted hover:text-text hover:bg-white/5'
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          
          <button onClick={() => window.print()} className="text-sm font-medium text-muted hover:text-text flex items-center gap-1.5 transition-colors print:hidden">
             <Download className="w-5 h-5"/> Exportar PDF
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full overflow-y-auto px-6 lg:px-8 py-6 pb-32 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto w-full">
        
        {/* ======================= DASHBOARD TAB ======================= */}
        {activeTab === 'Dashboard' && (
          <div className="w-full space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
               <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5 text-muted"/>
                  <h2 className="text-xl font-medium text-text tracking-tight">Resumo Operacional</h2>
               </div>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
               {[
                 { label: 'Eventos Totais', val: totalEventosFuturos, sub: 'Ainda não realizados', icon: <Calendar className="w-5 h-5"/> },
                 { label: 'Comercial Interno', val: comercialInterno, sub: 'Eventos futuros', icon: <Briefcase className="w-5 h-5"/> },
                 { label: 'Comercial Patrocinado', val: comercialPatrocinado, sub: 'Eventos futuros', icon: <Star className="w-5 h-5"/> },
                 { label: 'Confirmado', val: confirmados, sub: 'Status operacional', icon: <CheckCircle className="w-5 h-5"/> },
                 { label: 'Concluídos', val: concluidos, sub: 'Total histórico', icon: <Flag className="w-5 h-5"/> }
               ].map((m, i) => (
                 <div 
                   key={i} 
                   className="relative bg-surface/30 hover:bg-surface border border-white/5 hover:border-white/10 rounded-lg p-3.5 transition-all duration-200 group flex flex-col"
                 >
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-sm font-mono text-muted uppercase tracking-wider">{m.label}</h3>
                       <div className="text-muted group-hover:text-text transition-colors">{m.icon}</div>
                    </div>
                    <div className="text-3xl font-medium text-text tracking-tight">{m.val}</div>
                    <div className="text-sm text-muted mt-1">{m.sub}</div>
                 </div>
               ))}
            </div>

            {/* Vagas Abertas */}
            <div>
              <h3 className="text-sm font-mono text-muted uppercase tracking-wider mb-3">Vagas Abertas</h3>
              <div className="grid grid-cols-3 gap-3">
                 {[
                   { label: 'Staff', val: vagasStaffTotal, type: 'staff' as const, color: 'accent', icon: <User className="w-5 h-5"/> },
                   { label: 'Cliente', val: vagasClienteTotal, type: 'cliente' as const, color: 'green', icon: <Users className="w-5 h-5"/> },
                   { label: 'VIP', val: vagasVipTotal, type: 'vip' as const, color: 'purple', icon: <Star className="w-5 h-5"/> }
                 ].map((m, i) => (
                   <button
                     key={i}
                     onClick={() => { setVagasModalType(m.type); setVagasModalOpen(true); }}
                     className={`relative bg-surface/30 hover:bg-surface border border-white/5 hover:border-${m.color}/20 rounded-lg p-3.5 transition-all duration-200 group flex flex-col text-left cursor-pointer active:scale-[0.98]`}
                   >
                      <div className="flex justify-between items-center mb-2">
                         <h3 className="text-sm font-mono text-muted uppercase tracking-wider">{m.label}</h3>
                         <div className={`text-${m.color} group-hover:text-${m.color} transition-colors`}>{m.icon}</div>
                      </div>
                      <div className={`text-3xl font-medium text-${m.color} tracking-tight`}>{m.val}</div>
                      <div className="text-sm text-muted mt-1">Vagas em eventos futuros</div>
                      <div className="absolute bottom-2 right-3 text-[9px] font-mono text-muted/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Clique para ver →</div>
                   </button>
                 ))}
              </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 flex flex-col transition-all duration-300 lg:col-span-2">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium text-text flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-muted" /> Volume Mensal de Eventos
                      </h3>
                   </div>
                   <div className="flex-1 min-h-[220px]">
                      <Bar 
                        data={{
                          labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                          datasets: [{
                            label: 'Eventos',
                            data: monthStats,
                            backgroundColor: '#3b82f6',
                            borderRadius: 4,
                            barThickness: 12,
                            hoverBackgroundColor: '#2563eb'
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, grid: { color: theme === 'dark' ? '#1e293b' : '#f1f5f9' }, ticks: { font: { weight: 'normal', size: 9 } } },
                            x: { grid: { display: false }, ticks: { font: { weight: 'normal', size: 9 } } }
                          }
                        }}
                      />
                   </div>
                </div>

                <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 flex flex-col transition-all duration-300">
                   <h3 className="text-sm font-medium text-text mb-4 flex items-center gap-2">
                     <PieChart className="w-5 h-5 text-muted" /> Tipos de Eventos
                   </h3>
                   <div className="flex-1 min-h-[220px] relative">
                      <Doughnut 
                        data={{
                          labels: ['Comercial', 'Com. Interno', 'Com. Patroc.', 'Interno', 'Feriado'],
                          datasets: [{
                            data: [tipoStats.comercial, tipoStats.comercialInterno, tipoStats.comercialPatrocinado, tipoStats.interno, tipoStats.feriado],
                            backgroundColor: ['#3b82f6', '#8b5cf6', '#d946ef', '#10b981', '#fcd34d'],
                            borderWidth: 0
                          }]
                        }}
                        options={{
                          cutout: '75%',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: { font: { weight: 'normal', size: 9 }, usePointStyle: true, padding: 12, color: theme === 'dark' ? '#94a3b8' : '#64748b' }
                            }
                          }
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                         <span className="text-3xl font-semibold text-text tracking-tight">{totalEventosFuturos}</span>
                         <span className="text-sm font-mono text-muted uppercase tracking-wider mt-0.5">Total</span>
                      </div>
                   </div>
                </div>
            </div>

            {/* Secondary Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-surface rounded-[32px] border border-border p-8 flex flex-col shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-black text-text uppercase tracking-[0.3em] flex items-center gap-3">
                      <div className="w-2 h-6 bg-purple rounded-full" /> Atividade Histórica
                    </h3>
                  </div>
                  {renderGithubGraph()}
                  <div className="mt-6 flex justify-between items-center px-2">
                     <div className="flex gap-2 items-center">
                        <span className="text-sm font-black text-muted uppercase tracking-widest">Intensidade</span>
                        <div className="flex gap-1 ml-2">
                           {[1, 2, 3, 4, 5].map(i => <div key={i} className={cn("w-3 h-3 rounded-[2px]", i===1 ? 'bg-muted/10' : i===2 ? 'bg-accent/20' : i===3 ? 'bg-accent/40' : i===4 ? 'bg-accent/70' : 'bg-accent')} />)}
                        </div>
                     </div>
                     <span className="text-sm font-black text-muted uppercase tracking-widest">Últimos 280 Dias</span>
                  </div>
               </div>

               <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 flex flex-col transition-all duration-300 overflow-hidden">
                  <h3 className="text-sm font-medium text-text flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red" /> Alertas de Inventário
                  </h3>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                     {inventario.filter(i => i._collection === 'estoque' && (i.quantidade || 0) < 10).length > 0 ? (
                       inventario.filter(i => i._collection === 'estoque' && (i.quantidade || 0) < 10).map((i, idx) => (
                         <div key={idx} className="flex items-center justify-between p-3 bg-red/5 border border-red/10 rounded-lg group hover:bg-red/10 transition-all">
                            <div className="flex gap-3 items-center">
                               <div className="w-8 h-8 bg-surface rounded-md text-red flex items-center justify-center shadow-sm border border-red/10"><Package className="w-5 h-5"/></div>
                               <div>
                                  <p className="text-sm font-semibold text-text tracking-tight uppercase">{i.nome}</p>
                                  <p className="text-sm font-mono text-red uppercase tracking-widest mt-0.5 opacity-80">{i.tipo === 'brinde' ? 'Brinde' : i.tipo === 'uniforme' ? 'Uniforme' : 'Estoque'}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-xl font-semibold text-red leading-none">{i.quantidade}</p>
                               <p className="text-[8px] font-mono text-red uppercase tracking-widest mt-1 opacity-70">unidades</p>
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="h-32 flex flex-col items-center justify-center text-muted gap-2">
                          <CheckCircle className="w-6 h-6 opacity-40" />
                          <p className="text-sm font-mono uppercase tracking-widest">Estoque Estável</p>
                       </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 flex flex-col transition-all duration-300 xl:col-span-1">
                   <h3 className="text-sm font-medium text-text flex items-center gap-2 mb-4">
                     <Users className="w-5 h-5 text-accent" /> Top Organizadores
                   </h3>
                   <div className="flex flex-col gap-3 justify-center flex-1">
                      {orgStats.map((org, i) => (
                         <div key={i} className="flex items-center gap-3 group">
                              <div className="w-6 h-6 rounded-md bg-accent/5 text-accent font-semibold flex items-center justify-center text-sm shrink-0 border border-accent/10">{i+1}º</div>
                              <div className="flex-1 min-w-0">
                                 <div className="text-sm font-medium text-text truncate uppercase tracking-tight group-hover:text-accent transition-colors">{org.name}</div>
                              </div>
                              <div className="text-sm font-mono text-text bg-surface px-2 py-1 rounded-md border border-white/5">{org.count}</div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 flex flex-col transition-all duration-300 xl:col-span-2">
                    <h3 className="text-sm font-medium text-text flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-amber" /> Vagas Críticas
                    </h3>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
                          <thead>
                             <tr className="border-b border-white/5 text-muted font-mono uppercase text-sm tracking-widest">
                                <th className="pb-3 pr-4 font-medium">Data</th>
                                <th className="pb-3 px-5 font-medium">Evento</th>
                                <th className="pb-3 pl-4 text-right font-medium">Saldo de Vagas</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {eventosComVagas.slice(0, 6).map(evt => (
                                <tr key={evt.id} className="hover:bg-white/5 transition-all cursor-pointer group">
                                  <td className="py-4 pr-4 font-mono text-muted text-sm uppercase">{formatToBRDate(evt.data_ini)}</td>
                                  <td className="py-4 px-5 font-medium text-sm text-text group-hover:text-amber transition-colors">{evt.evento}</td>
                                  <td className="py-4 pl-4 font-semibold text-amber text-right text-base">{(Number(evt.vagas_cliente)||0) + (Number(evt.vagas_staff)||0) + (Number(evt.vagas_vip)||0)}</td>
                                </tr>
                             ))}
                          </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* ======================= OPERACIONAL TAB ======================= */}
        {activeTab === 'Operacional' && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
               <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted"/> 
                  <h2 className="text-xl font-medium text-text tracking-tight">Gestão Operacional</h2>
               </div>
             </div>

             <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Lateral Navigation Menu */}
                <div className="w-full lg:w-56 bg-transparent flex flex-col gap-1 shrink-0 sticky top-28">
                  {[
                    { id: 'Visão Geral', icon: <LayoutDashboard className="w-5 h-5"/> },
                    { id: 'Estoque', icon: <Box className="w-5 h-5"/> },
                    { id: 'Pedidos de Compra', icon: <Package className="w-5 h-5"/> },
                    { id: 'Fornecedores', icon: <Building2 className="w-5 h-5"/> },
                    { id: 'Viagens', icon: <Plane className="w-5 h-5"/> },
                    { id: 'Participantes', icon: <Users2 className="w-5 h-5"/> }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setOpTab(tab.id as any)} 
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group",
                        opTab === tab.id ? 'text-text bg-surface/80 shadow-sm border border-white/5' : 'text-muted hover:text-text hover:bg-surface/40'
                      )}
                    >
                      <div className={cn("transition-colors", opTab === tab.id ? 'text-accent' : 'text-muted group-hover:text-text')}>{tab.icon}</div> 
                      {tab.id}
                    </button>
                  ))}
                </div>

                {/* Right Module Content Area */}
                <div className="flex-1 w-full flex flex-col gap-6">

                   {/* Visão Geral Module */}
                   {opTab === 'Visão Geral' && (
                     <div className="flex-1 flex flex-col animate-in fade-in duration-300">
                        <div className="flex flex-col flex-1">
                           <h2 className="text-base font-semibold text-text mb-4">Métricas Operacionais</h2>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                              {[
                                { 
                                  label: 'Brindes Estoque', val: qtdTotalBrindes, color: 'text-accent', 
                                  action: () => { setOpModalData({ title: 'Brindes em Estoque', type: 'estoque', list: brindesData }); setOpModalOpen(true); } 
                                },
                                { 
                                  label: 'Brindes Alocados', val: qtdBrindesAlocadosFuturo, color: 'text-amber',
                                  action: () => { setOpModalData({ title: 'Brindes Alocados (Futuros)', type: 'alocados', list: listBrindesAlocadosFuturo }); setOpModalOpen(true); }
                                },
                                { 
                                  label: 'Brindes Entregues', val: qtdBrindesEntregues, color: 'text-green',
                                  action: () => { setOpModalData({ title: 'Brindes Entregues (Concluídos)', type: 'entregues', list: listBrindesEntregues }); setOpModalOpen(true); }
                                },
                                { 
                                  label: 'Baixo Estoque', val: numBrindesBaixoEstoque, color: 'text-red',
                                  action: () => { setOpModalData({ title: 'Brindes Baixo Estoque (Sem Uso)', type: 'baixo_estoque', list: listBrindesBaixoEstoque }); setOpModalOpen(true); }
                                },
                                { 
                                  label: 'Partic. Cadastrados', val: numParticipantesCadastrados, color: 'text-purple',
                                  action: () => setOpTab('Participantes')
                                },
                                { label: 'Equipe em Eventos', val: equipeEmEventosFuturos, color: 'text-blue' },
                                { label: 'Equipe em Campo', val: equipeEmCampoHoje, color: 'text-green' },
                                { 
                                  label: 'Pedidos', val: pedidosPendentes, color: 'text-orange',
                                  action: () => { setOpModalData({ title: 'Pedidos Abertos', type: 'pedidos', list: pedidosPendentesList }); setOpModalOpen(true); }
                                }
                              ].map((m, i) => (
                                <div 
                                  key={i} 
                                  onClick={m.action}
                                  className={cn("bg-surface/30 hover:bg-surface border border-white/5 hover:border-white/10 rounded-lg p-3.5 transition-all duration-200 flex flex-col", m.action ? "cursor-pointer active:scale-[0.98] group" : "")}
                                >
                                   <div className="flex justify-between items-start">
                                      <span className="text-[10px] sm:text-xs font-mono text-muted uppercase tracking-wider mb-2">{m.label}</span>
                                      {m.action && <div className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">Ver →</div>}
                                   </div>
                                   <span className={cn("text-2xl sm:text-3xl font-medium tracking-tight", m.color)}>
                                      {m.val}
                                   </span>
                                </div>
                              ))}
                           </div>
                           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1">
                              <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 flex flex-col transition-all duration-300">
                                 <h3 className="text-sm font-medium text-text mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red"/> Alertas Críticos de Estoque
                                 </h3>
                                 <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {inventario.filter(i => i._collection === 'estoque' && (i.quantidade || 0) < 10).length > 0 ? (
                                       inventario.filter(i => i._collection === 'estoque' && (i.quantidade || 0) < 10).map(item => (
                                          <div key={item.id} className="flex items-center justify-between p-3 bg-surface border border-white/5 rounded-lg group hover:border-red/30 transition-all">
                                             <div className="flex flex-col">
                                                <span className="text-sm font-medium text-text tracking-tight uppercase">{item.nome}</span>
                                                <span className="text-sm text-muted font-mono uppercase tracking-widest mt-0.5 opacity-80">REF: {item.id.substring(0,8).toUpperCase()}</span>
                                             </div>
                                             <div className="flex flex-col items-end">
                                                <span className="text-xl font-semibold text-red leading-none">{item.quantidade || 0} un</span>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                   <div className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
                                                   <span className="text-[8px] font-mono text-red uppercase tracking-widest">Abaixo do Limite</span>
                                                </div>
                                             </div>
                                          </div>
                                       ))
                                    ) : (
                                       <div className="h-full flex flex-col items-center justify-center text-muted gap-2 opacity-60">
                                          <CheckCircle className="w-6 h-6 stroke-1" />
                                          <p className="text-sm font-mono uppercase tracking-widest">Logística Estável</p>
                                       </div>
                                    )}
                                 </div>
                              </div>

                              <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 flex flex-col transition-all duration-300">
                                 <h3 className="text-sm font-medium text-text mb-4 flex items-center gap-2">
                                    <Box className="w-5 h-5 text-accent"/> Fluxo Recente de Alocações
                                 </h3>
                                 <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {events.filter(e => e.brindes_alocados && e.brindes_alocados.length > 0).slice(0, 8).map(evt => (
                                       <div key={evt.id} className="p-3 bg-surface border border-white/5 rounded-lg hover:border-accent/30 transition-all group">
                                          <div className="flex justify-between items-start mb-2">
                                             <span className="text-sm font-medium text-text truncate max-w-[200px] group-hover:text-accent transition-colors">{evt.evento}</span>
                                             <span className="text-sm font-mono text-muted uppercase">{formatToBRDate(evt.data_ini)}</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5">
                                             {evt.brindes_alocados?.map((b, idx: number) => (
                                                <span key={idx} className="bg-accent/10 text-accent px-2 py-0.5 rounded text-sm font-mono uppercase border border-accent/20">
                                                   {b.qtd}x {b.item}
                                                </span>
                                             ))}
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* Estoque Module */}
                   {opTab === 'Estoque' && (
                     <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                        {/* Toolbar */}
                        <div className="flex flex-wrap gap-4 justify-between items-center bg-surface/40 backdrop-blur-xl p-3 rounded-xl border border-white/5">
                           <div className="flex flex-1 gap-4 min-w-[300px]">
                              <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/40" />
                                <input type="text" placeholder="Pesquisar por item ou descrição..." value={searchTerms.almoxarifado} onChange={(e) => setSearchTerms({ ...searchTerms, almoxarifado: e.target.value })} className="w-full pl-9 pr-4 py-2 bg-bg/50 border border-white/5 rounded-lg text-sm font-medium focus:bg-surface focus:border-white/10 outline-none transition-all placeholder:text-sm" />
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <button onClick={() => openForm('estoque')} className="bg-accent text-white font-medium px-5 py-2 rounded-lg text-sm hover:bg-accent/80 transition-all flex items-center gap-2">
                               <Plus className="w-5 h-5"/> Novo Item
                             </button>
                           </div>
                        </div>

                        {/* Grid Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
                           {inventario.filter(i => 
                             (i._collection === 'estoque') && 
                             ((i.nome || '').toLowerCase().includes(searchTerms.almoxarifado.toLowerCase()) || 
                             (i.descricao || '').toLowerCase().includes(searchTerms.almoxarifado.toLowerCase()))
                           ).length > 0 ? inventario.filter(i => 
                             (i._collection === 'estoque') && 
                             ((i.nome || '').toLowerCase().includes(searchTerms.almoxarifado.toLowerCase()) || 
                             (i.descricao || '').toLowerCase().includes(searchTerms.almoxarifado.toLowerCase()))
                           ).map((item, idx) => (
                             <div key={idx} className="bg-surface/30 hover:bg-surface backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 flex flex-col relative group transition-all duration-300">
                                <span className={cn(
                                   "absolute top-6 left-5 text-sm font-mono uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1.5",
                                   item.tipo === 'brinde' ? 'bg-amber/10 text-amber border-amber/20' : (item.tipo === 'uniforme' ? 'bg-purple/10 text-purple border-purple/20' : 'bg-green/10 text-green border-green/20')
                                )}>
                                   {item.tipo === 'brinde' ? <Package className="w-5 h-5"/> : <Shirt className="w-5 h-5"/>} {item.tipo}
                                </span>
                                
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-1">
                                  <button onClick={() => openForm('estoque', item)} className="p-1.5 bg-surface text-muted hover:text-accent rounded border border-white/5"><Edit2 className="w-5 h-5"/></button>
                                   <button onClick={() => handleDeleteItem(item._collection || 'estoque', item.id, item.tipo || 'estoque')} className="p-1.5 bg-surface text-muted hover:text-red rounded border border-white/5"><Trash2 className="w-5 h-5"/></button>
                                </div>
                                
                                <div className="mt-8 mb-3 flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                       <h3 className="text-base font-bold text-text truncate">{item.nome}</h3>
                                       {item.nivel && (
                                          <span className="text-[9px] font-black bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/10 uppercase tracking-tighter">
                                             {item.nivel}
                                          </span>
                                       )}
                                    </div>
                                    <p className="text-sm text-muted mt-1 line-clamp-2">{item.descricao || 'Nenhuma descrição técnica fornecida.'}</p>
                                    
                                    {item.fornecedor && (
                                       <div className="flex items-center gap-1.5 mt-2.5 opacity-60">
                                          <div className="w-4 h-4 rounded bg-muted/20 flex items-center justify-center text-[8px] font-bold text-muted">F</div>
                                          <span className="text-[11px] font-bold text-muted uppercase tracking-tight truncate">FORN: {item.fornecedor}</span>
                                       </div>
                                    )}

                                   {(() => {
                                      const linkedEvent = item.evento_id ? events.find((e:any) => e.id === item.evento_id) : null;
                                      const allocations = events.filter((e:any) => e.brindes_alocados?.some((b:any) => b.id === item.id || b.item === item.nome));
                                      const totalAlloc = allocations.reduce((sum, e:any) => sum + (Number(e.brindes_alocados?.find((b:any) => b.id === item.id || b.item === item.nome)?.qtd) || 0), 0);

                                      if (linkedEvent) {
                                         return (
                                            <div className="mt-4 flex items-center justify-between bg-accent/5 border border-accent/10 px-3 py-2 rounded-lg">
                                               <div className="flex flex-col min-w-0">
                                                 <span className="text-[10px] font-black text-accent uppercase tracking-widest truncate">Evento Vinculado</span>
                                                 <span className="text-[11px] font-semibold text-text truncate">{linkedEvent.evento}</span>
                                               </div>
                                               <div className="flex flex-col items-end shrink-0 pl-2">
                                                 <span className="text-[10px] font-black text-muted uppercase tracking-widest">Qtd. Base</span>
                                                 <span className="text-[11px] font-bold text-text">{item.quantidade || 0} un.</span>
                                               </div>
                                            </div>
                                         );
                                      } else if (allocations.length > 0) {
                                         return (
                                            <div className="mt-4 flex items-center justify-between bg-green/5 border border-green/10 px-3 py-2 rounded-lg">
                                               <div className="flex flex-col min-w-0">
                                                 <span className="text-[10px] font-black text-green uppercase tracking-widest truncate">Em {allocations.length} {allocations.length === 1 ? 'Evento' : 'Eventos'}</span>
                                                 <span className="text-[11px] font-semibold text-text truncate" title={allocations.map((e:any) => e.evento).join(', ')}>
                                                   {allocations.map((e:any) => e.evento).join(', ')}
                                                 </span>
                                               </div>
                                               <div className="flex flex-col items-end shrink-0 pl-2">
                                                 <span className="text-[10px] font-black text-muted uppercase tracking-widest">Alocados</span>
                                                 <span className="text-[11px] font-bold text-text">{totalAlloc} un.</span>
                                               </div>
                                            </div>
                                         );
                                      }
                                      return (
                                         <div className="mt-4 flex items-center bg-bg/50 border border-white/5 px-3 py-2 rounded-lg">
                                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Estoque Central Livre</span>
                                         </div>
                                      );
                                   })()}
                                </div>
                                
                                <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5">
                                   <div className="flex flex-col gap-1.5">
                                      <span className="text-sm font-mono text-muted uppercase tracking-wider">Estoque</span>
                                      <div className="flex items-center gap-2 bg-bg/50 border border-white/5 py-1 px-2 rounded-md">
                                         <button onClick={() => handleUpdateQuantity(item, -1)} className="text-muted hover:text-red w-5 h-5 flex items-center justify-center rounded hover:bg-red/10">-</button>
                                         <span className="text-base font-semibold text-text min-w-[24px] text-center">{item.quantidade || 0}</span>
                                         <button onClick={() => handleUpdateQuantity(item, 1)} className="text-muted hover:text-green w-5 h-5 flex items-center justify-center rounded hover:bg-green/10">+</button>
                                      </div>
                                   </div>
                                   <div className="flex flex-col items-end gap-1 mb-1">
                                      <span className="text-sm font-mono text-muted uppercase tracking-wider">Vlr. Unitário</span>
                                      <span className="text-sm font-semibold text-text">R$ {item.preco || '0,00'}</span>
                                   </div>
                                </div>
                             </div>
                           )) : (
                             <div className="col-span-full py-16 text-center text-muted flex flex-col items-center border border-dashed border-white/10 rounded-xl bg-surface/30">
                               <Package className="w-10 h-10 mb-3 opacity-20"/>
                               <p className="text-sm font-mono uppercase tracking-widest">Nenhum item localizado no estoque.</p>
                             </div>
                           )}
                        </div>
                     </div>
                   )}

                   {/* Modals are handled globally above */}
                   
                   {/* Pedidos de Compra Module */}
                   {opTab === 'Pedidos de Compra' && (
                      <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500 h-full min-h-[700px]">
                         <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex gap-2">
                               <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg border flex items-center justify-center transition-all", viewMode==='grid' ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface/50 border-white/5 text-muted hover:text-text")} title="Visualização Kanban">
                                  <LayoutDashboard className="w-5 h-5" />
                               </button>
                               <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg border flex items-center justify-center transition-all", viewMode==='list' ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface/50 border-white/5 text-muted hover:text-text")} title="Visualização Lista">
                                  <Box className="w-5 h-5" />
                               </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => { setEditingPedido(null); setPedidoModalOpen(true); }} className="bg-accent text-white font-medium px-5 py-2 rounded-lg text-sm hover:bg-accent/80 transition-all flex items-center gap-2">
                                <Plus className="w-5 h-5"/> Novo Pedido
                              </button>
                            </div>
                         </div>
                         <KanbanBoard 
                           items={inventario.filter(i => i._collection === 'pedidos')} 
                           viewMode={viewMode}
                           onEditItem={(item) => { setEditingPedido(item); setPedidoModalOpen(true); }}
                           onUpdateStatus={async (id, newStatus, item) => {
                              try {
                                const db = getFirebaseDb();
                                await updateDoc(doc(db, "pedidos", id), { status: newStatus });
                                fetchInventory();
                              } catch(e) { console.error(e); }
                           }}
                           onDelete={async (id) => {
                              if(!confirm("Remover este pedido?")) return;
                              try {
                                await deleteDoc(doc(getFirebaseDb(), "pedidos", id));
                                fetchInventory();
                              } catch(e) { console.error(e); }
                           }}
                           onSendToEstoque={async (item) => {
                              try {
                                const db = getFirebaseDb();
                                // Create in estoque
                                await addDoc(collection(db, "estoque"), {
                                   nome: item.nome,
                                   descricao: item.descricao || '',
                                   quantidade: item.quantidade || 0,
                                   preco: item.preco || '0,00',
                                   tipo: item.tipo,
                                   nivel: item.nivel || null,
                                   tamanhos: item.tamanhos || null,
                                   fornecedor: item.fornecedor || null,
                                   status: 'Estoque',
                                   createdAt: serverTimestamp(),
                                   updatedAt: serverTimestamp()
                                });
                                // Remove from pedidos
                                await deleteDoc(doc(db, "pedidos", item.id));
                                fetchInventory();
                              } catch(e) { console.error(e); }
                           }}
                         />
                      </div>
                   )}

                   {/* Rest of OpTabs follow the same style pattern */}
                   {['Fornecedores', 'Viagens', 'Participantes'].includes(opTab) && (
                      <div className="bg-surface/30 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden flex flex-col flex-1 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                         
                         <div className="p-4 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 bg-surface/50">
                            <div className="relative w-full max-w-md">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/40" />
                              <input 
                                type="text" 
                                placeholder={`Pesquisar em ${opTab}...`} 
                                className="w-full pl-9 pr-4 py-2 bg-bg/50 border border-white/5 rounded-lg text-sm font-medium focus:border-white/10 outline-none transition-all placeholder:text-sm" 
                                value={searchTerms[opTab.toLowerCase() as keyof typeof searchTerms] || ''}
                                onChange={(e) => setSearchTerms({ ...searchTerms, [opTab.toLowerCase()]: e.target.value })}
                              />
                            </div>
                            <button onClick={() => {
                               if (opTab === 'Fornecedores') openForm('fornecedor');
                               else if (opTab === 'Viagens') { setEditingViagem(null); setViagemModalOpen(true); }
                               else if (opTab === 'Participantes') { setEditingParticipante(null); setParticipanteModalOpen(true); }
                            }} className="bg-accent hover:bg-accent/80 text-white font-medium px-5 py-2 rounded-lg transition-all flex items-center gap-2 text-sm whitespace-nowrap">
                              <Plus className="w-5 h-5"/> Novo {opTab.slice(0, -1)}
                            </button>
                         </div>

                         <div className="overflow-x-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                               <thead>
                                 <tr className="border-b border-white/5 text-muted font-mono uppercase text-sm tracking-widest">
                                    {opTab === 'Fornecedores' && <><th className="py-4 px-5 font-medium">Empresa Fornecedora</th><th className="py-4 px-5 font-medium">Contato Responsável</th><th className="py-4 px-5 font-medium">E-mail Corporativo</th><th className="py-4 px-5 font-medium">Telefone / WhatsApp</th></>}
                                    {opTab === 'Viagens' && <><th className="py-4 px-5 font-medium">Trecho / Voo</th><th className="py-4 px-5 font-medium">Passageiro (Integrante)</th><th className="py-4 px-5 text-center font-medium">Status</th><th className="py-4 px-5 font-medium">Localizador</th><th className="py-4 px-5 text-right font-medium">Taxas (R$)</th></>}
                                    {opTab === 'Participantes' && <><th className="py-4 px-5 font-medium">Nome Completo</th><th className="py-4 px-5 font-medium">Email</th><th className="py-4 px-5 font-medium">WhatsApp</th><th className="py-4 px-5 font-medium">Função</th><th className="py-4 px-5 text-center font-medium">Tam</th></>}
                                    <th className="py-4 px-5 text-right font-medium">Ações</th>
                                 </tr>
                               </thead>
                                <tbody className="divide-y divide-white/5">
                                  {opTab === 'Fornecedores' && filteredFornecedores.map((f) => (
                                    <tr key={f.id} className="hover:bg-white/5 transition-all group cursor-default">
                                       <td className="py-4 px-5 font-medium text-sm text-text uppercase tracking-tight">{f.nome}</td>
                                       <td className="py-4 px-5 font-medium text-sm text-muted">{f.contato_responsavel || '---'}</td>
                                       <td className="py-4 px-5 font-medium text-sm text-muted">{f.email || '---'}</td>
                                       <td className="py-4 px-5 font-mono text-sm text-muted">{f.telefone || '---'}</td>
                                       <td className="py-4 px-5 text-right"><div className="flex justify-end gap-1.5"><button onClick={() => openForm('fornecedor', f)} className="p-1.5 bg-surface text-muted hover:text-accent rounded border border-white/5"><Edit2 className="w-5 h-5"/></button><button onClick={() => handleDeleteItem('fornecedores', f.id, 'fornecedor')} className="p-1.5 bg-surface text-muted hover:text-red rounded border border-white/5"><Trash2 className="w-5 h-5"/></button></div></td>
                                    </tr>
                                  ))}
                                  {opTab === 'Viagens' && filteredViagens.map((v) => (
                                    <tr key={v.id} className="hover:bg-white/5 transition-all group">
                                       <td className="py-4 px-5 font-medium text-sm text-text uppercase tracking-tight">{v.trecho}</td>
                                       <td className="py-4 px-5 font-medium text-sm text-muted uppercase tracking-tight">{v.passageiro}</td>
                                       <td className="py-4 px-5 text-center"><span className={cn("px-2 py-0.5 rounded text-sm font-mono uppercase border", v.status === 'Emitido' ? 'bg-green/10 text-green border-green/20' : 'bg-surface text-muted border-white/5')}>{v.status}</span></td>
                                       <td className="py-4 px-5 font-mono text-sm text-text uppercase tracking-widest">{v.localizador || '---'}</td>
                                       <td className="py-4 px-5 font-mono text-sm text-emerald-500 text-right">R$ {v.valor || '0,00'}</td>
                                       <td className="py-4 px-5 text-right"><div className="flex justify-end gap-1.5"><button onClick={() => {setEditingViagem(v); setViagemModalOpen(true);}} className="p-1.5 bg-surface text-muted hover:text-accent rounded border border-white/5"><Edit2 className="w-5 h-5"/></button><button onClick={async () => { if(confirm("Deletar viagem?")){ await deleteDoc(doc(getFirebaseDb(), "viagens", v.id)); fetchViagens(); } }} className="p-1.5 bg-surface text-muted hover:text-red rounded border border-white/5"><Trash2 className="w-5 h-5"/></button></div></td>
                                    </tr>
                                  ))}
                                  {opTab === 'Participantes' && filteredParticipantes.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-all group cursor-default">
                                       <td className="py-4 px-5 font-medium text-sm text-text uppercase tracking-tight">{p.nome}</td>
                                       <td className="py-4 px-5 font-medium text-sm text-muted">{p.email || '---'}</td>
                                       <td className="py-4 px-5 font-mono text-sm text-muted">{p.telefone || '---'}</td>
                                       <td className="py-4 px-5"><span className="bg-surface text-muted px-2 py-0.5 rounded text-sm font-mono uppercase border border-white/5">{p.funcao || '---'}</span></td>
                                       <td className="py-4 px-5 font-mono text-sm text-text text-center uppercase">{p.tamanho || '--'}</td>
                                       <td className="py-4 px-5 text-right"><div className="flex justify-end gap-1.5"><button onClick={() => {setEditingParticipante(p); setParticipanteModalOpen(true);}} className="p-1.5 bg-surface text-muted hover:text-accent rounded border border-white/5"><Edit2 className="w-5 h-5"/></button><button onClick={async () => { if(confirm("Deletar participante?")){ await deleteDoc(doc(getFirebaseDb(), "participantes", p.id)); fetchParticipantes(); } }} className="p-1.5 bg-surface text-muted hover:text-red rounded border border-white/5"><Trash2 className="w-5 h-5"/></button></div></td>
                                    </tr>
                                  ))}
                                  {/* Placeholder generic row if empty */}
                                  {((opTab === 'Fornecedores' && filteredFornecedores.length === 0) ||
                                    (opTab === 'Viagens' && filteredViagens.length === 0) ||
                                    (opTab === 'Participantes' && filteredParticipantes.length === 0)) && (
                                     <tr><td colSpan={10} className="py-12 text-center text-muted/40 font-mono text-sm uppercase tracking-widest">Nenhum registro localizado</td></tr>
                                  )}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* ======================= RELATÓRIOS TAB ======================= */}
        {activeTab === 'Relatórios' && (
          <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                   <PieChart className="w-5 h-5 text-muted"/>
                   <h2 className="text-xl font-medium text-text tracking-tight">Analytics & Performance</h2>
                </div>
                <button className="bg-surface/50 border border-white/5 text-text px-5 py-2 rounded-lg hover:bg-surface transition-all flex items-center gap-2 text-sm font-medium">
                   <Download className="w-5 h-5 text-muted"/> Gerar Relatório
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 transition-all duration-300">
                   <h3 className="text-sm font-medium text-text mb-6 flex items-center gap-2">
                     <PieChart className="w-5 h-5 text-accent" /> Investimento Operacional
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="h-64 flex items-center justify-center relative">
                         <Pie 
                            data={{
                               labels: ['Brindes', 'Uniformes', 'Logística'],
                               datasets: [{
                                  data: [custoTotalBrindes, custoTotalUniformes, 12500],
                                  backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'],
                                  borderWidth: 0
                                }]
                            }}
                            options={{
                               maintainAspectRatio: false,
                               plugins: { legend: { position: 'bottom', labels: { font: { weight: 'normal', size: 10 }, color: theme === 'dark' ? '#94a3b8' : '#64748b', usePointStyle: true, padding: 15 } } }
                            }}
                         />
                      </div>
                      <div className="flex flex-col justify-center gap-4">
                         <div className="p-4 bg-surface border border-white/5 rounded-lg flex flex-col gap-1">
                            <span className="text-sm font-mono text-muted uppercase tracking-wider">Aquisição de Brindes</span>
                            <p className="text-2xl font-semibold text-text tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotalBrindes)}</p>
                         </div>
                         <div className="p-4 bg-surface border border-white/5 rounded-lg flex flex-col gap-1">
                            <span className="text-sm font-mono text-muted uppercase tracking-wider">Produção de Uniformes</span>
                            <p className="text-2xl font-semibold text-text tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotalUniformes)}</p>
                         </div>
                         <div className="pt-4 border-t border-white/5 flex flex-col gap-1 mt-2">
                            <span className="text-sm font-mono text-green uppercase tracking-wider">Total Investido (Período)</span>
                            <p className="text-3xl font-bold text-green tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotalBrindes + custoTotalUniformes + 12500)}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-300">
                   <h3 className="text-sm font-medium text-text mb-6 w-full text-left">Saúde das Entregas</h3>
                   <div className="h-48 mb-6 relative w-full">
                      <Doughnut 
                         data={{
                            labels: ['Concluídos', 'Em Aberto'],
                            datasets: [{
                               data: [events.filter(e => e.status === 'Concluído').length, events.filter(e => e.status !== 'Concluído').length],
                               backgroundColor: ['#10b981', '#334155'],
                               borderWidth: 0
                            }]
                         }}
                         options={{ cutout: '80%', maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
                         <span className="text-3xl font-bold text-text tracking-tight">{Math.round((events.filter(e => e.status === 'Concluído').length / Math.max(events.length,1)) * 100)}%</span>
                         <span className="text-sm font-mono text-muted uppercase tracking-widest mt-0.5">Conclusão</span>
                      </div>
                   </div>
                   <div className="w-full space-y-2">
                      <div className="flex justify-between items-center text-sm font-mono text-muted uppercase tracking-widest bg-surface border border-white/5 px-3 py-2 rounded-md">
                         <span>Meta Mensal</span>
                         <span className="text-text font-semibold">95.0%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-mono text-muted uppercase tracking-widest bg-surface border border-white/5 px-3 py-2 rounded-md">
                         <span>Gap de Performance</span>
                         <span className="text-red font-semibold">{(95 - Math.round((events.filter(e => e.status === 'Concluído').length / Math.max(events.length,1)) * 100)).toFixed(1)}%</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ======================= EVENTOS TAB ======================= */}
        {activeTab === 'Eventos' && (
          <div className="w-full px-6 lg:px-10 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-6">
               <div>
                  <h2 className="text-2xl font-medium text-text flex items-center gap-3 tracking-tight"><Calendar className="w-6 h-6 text-accent"/> Registro de Eventos</h2>
                  <p className="text-sm font-mono text-muted mt-2 tracking-widest uppercase">Auditória, Edição Massiva e Controle de Status em Tempo Real</p>
               </div>
               <button onClick={() => {setEditingEvent(null); setEventModalOpen(true);}} className="bg-accent text-white font-medium px-5 py-2 rounded-lg hover:bg-accent/80 transition-all flex items-center gap-2 text-sm">
                 <Plus className="w-5 h-5"/> Criar Evento
               </button>
            </div>
            
            <div className="bg-surface/30 backdrop-blur-xl border border-white/5 rounded-xl flex flex-col overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
                      <thead>
                         <tr className="border-b border-white/5 text-muted font-mono uppercase text-sm tracking-widest">
                            <th className="py-4 px-5 font-medium">Data</th>
                            <th className="py-4 px-5 font-medium">Evento</th>
                            <th className="py-4 px-5 font-medium">Localidade</th>
                            <th className="py-4 px-5 text-center font-medium">Tipo</th>
                            <th className="py-4 px-5 text-center font-medium">Status</th>
                            <th className="py-4 px-5 text-right font-medium">Controles</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {events.length > 0 ? events.sort((a,b) => new Date(b.data_ini || 0).getTime() - new Date(a.data_ini || 0).getTime()).map(evt => (
                            <tr key={evt.id} className="hover:bg-white/5 transition-all group">
                               <td className="py-4 px-5 font-mono text-sm text-muted tracking-tight uppercase">{evt.data_ini ? formatToBRDate(evt.data_ini) : '---'}</td>
                               <td className="py-4 px-5 font-medium text-sm text-text group-hover:text-accent transition-colors uppercase tracking-tight">{evt.evento}</td>
                               <td className="py-4 px-5 font-medium text-sm text-muted uppercase truncate max-w-[200px]">{evt.localidade || '---'}</td>
                               <td className="py-4 px-5 text-center">
                                  <span className="text-sm bg-surface text-muted font-mono px-2 py-0.5 rounded border border-white/5 tracking-widest uppercase">{evt.tipo || 'PADRÃO'}</span>
                               </td>
                               <td className="py-4 px-5 text-center">
                                  <span className={cn(
                                    "text-sm font-mono px-2 py-0.5 rounded tracking-widest border uppercase transition-all",
                                    evt.status === 'Confirmado' ? 'bg-green/10 text-green border-green/20' : 
                                    evt.status === 'Concluído' ? 'bg-purple/10 text-purple border-purple/20' : 
                                    evt.status === 'Em negociação' ? 'bg-amber/10 text-amber border-amber/20' : 'bg-surface text-muted border-white/5'
                                  )}>{evt.status || 'Pendente'}</span>
                               </td>
                               <td className="py-4 px-5 text-right">
                                  <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => {setEditingEvent(evt); setEventModalOpen(true);}} className="p-1.5 bg-surface border border-white/5 rounded text-muted hover:text-accent transition-all"><Edit2 className="w-5 h-5"/></button>
                                     <button className="p-1.5 bg-surface border border-white/5 rounded text-muted hover:text-red transition-all"><Trash2 className="w-5 h-5"/></button>
                                  </div>
                               </td>
                            </tr>
                         )) : (
                            <tr><td colSpan={7} className="py-12 text-center text-muted/40 font-mono text-sm uppercase tracking-widest">Nenhum evento registrado no banco operacional.</td></tr>
                         )}
                      </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {/* ======================= USUARIOS TAB ======================= */}
        {activeTab === 'Usuarios' && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
               <div>
                  <h2 className="text-2xl font-medium text-text flex items-center gap-3 tracking-tight"><Users className="w-6 h-6 text-accent"/> Gestão de Usuários</h2>
                  <p className="text-sm font-mono text-muted mt-2 tracking-widest uppercase">Controle de acessos, aprovação e permissões do sistema</p>
               </div>
               <button 
                 onClick={() => { setAddUserModalOpen(true); setAddUserError(""); }}
                 className="bg-accent text-white font-medium px-5 py-2 rounded-lg hover:bg-accent/80 transition-all flex items-center gap-2 text-sm shrink-0"
               >
                 <Plus className="w-5 h-5"/> Adicionar Usuário
               </button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total de Usuários', val: allUsers.length, icon: <Users className="w-5 h-5"/>, color: 'text-accent' },
                { label: 'Administradores', val: allUsers.filter(u => u.role === 'admin').length, icon: <ShieldAlert className="w-5 h-5"/>, color: 'text-purple' },
                { label: 'Aprovados', val: allUsers.filter(u => u.role === 'approved').length, icon: <CheckCircle className="w-5 h-5"/>, color: 'text-green' },
                { label: 'Pendentes', val: allUsers.filter(u => u.role === 'pending').length, icon: <Clock className="w-5 h-5"/>, color: 'text-amber' },
              ].map((m, i) => (
                <div key={i} className="bg-surface/30 hover:bg-surface border border-white/5 hover:border-white/10 rounded-lg p-3.5 transition-all duration-200 flex flex-col">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] sm:text-xs font-mono text-muted uppercase tracking-wider">{m.label}</span>
                      <div className={cn("transition-colors", m.color)}>{m.icon}</div>
                   </div>
                   <span className={cn("text-3xl font-medium tracking-tight", m.color)}>{m.val}</span>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="flex flex-wrap gap-4 items-center bg-surface/40 backdrop-blur-xl p-3 rounded-xl border border-white/5">
               <div className="relative flex-1 min-w-[250px]">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted/40" />
                 <input 
                   type="text" 
                   placeholder="Pesquisar por nome ou e-mail..." 
                   value={searchTerms.usuarios} 
                   onChange={(e) => setSearchTerms({ ...searchTerms, usuarios: e.target.value })} 
                   className="w-full pl-9 pr-4 py-2 bg-bg/50 border border-white/5 rounded-lg text-sm font-medium focus:bg-surface focus:border-white/10 outline-none transition-all placeholder:text-sm" 
                 />
               </div>
            </div>

            {/* Users Table */}
            <div className="bg-surface/30 backdrop-blur-xl border border-white/5 rounded-xl flex flex-col overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                      <thead>
                         <tr className="border-b border-white/5 text-muted font-mono uppercase text-sm tracking-widest">
                            <th className="py-4 px-5 font-medium">Usuário</th>
                            <th className="py-4 px-5 font-medium">E-mail</th>
                            <th className="py-4 px-5 text-center font-medium">Status</th>
                            <th className="py-4 px-5 text-center font-medium">Função</th>
                            <th className="py-4 px-5 text-right font-medium">Ações</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {(() => {
                           const searchTerm = (searchTerms.usuarios || '').toLowerCase();
                           const filtered = allUsers.filter(u => 
                             (u.nome || '').toLowerCase().includes(searchTerm) || 
                             (u.email || '').toLowerCase().includes(searchTerm)
                           );
                           
                           if (filtered.length === 0) {
                             return (
                               <tr><td colSpan={5} className="py-12 text-center text-muted/40 font-mono text-sm uppercase tracking-widest">
                                 {allUsers.length === 0 ? 'Nenhum usuário cadastrado no sistema.' : 'Nenhum usuário encontrado com este filtro.'}
                               </td></tr>
                             );
                           }
                           
                           // Sort: pending first, then admin, then approved
                           const sortOrder: Record<string, number> = { pending: 0, admin: 1, approved: 2 };
                           const sorted = [...filtered].sort((a, b) => (sortOrder[a.role] ?? 3) - (sortOrder[b.role] ?? 3));
                           
                           return sorted.map(usr => (
                             <tr key={usr.id} className="hover:bg-white/5 transition-all group">
                                <td className="py-4 px-5">
                                   <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border shrink-0",
                                        usr.role === 'admin' ? 'bg-purple/10 text-purple border-purple/20' :
                                        usr.role === 'pending' ? 'bg-amber/10 text-amber border-amber/20' :
                                        'bg-accent/10 text-accent border-accent/20'
                                      )}>
                                        {(usr.nome || usr.email || '??').substring(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-text tracking-tight">{usr.nome || 'Sem nome'}</p>
                                        <p className="text-xs text-muted font-mono mt-0.5">ID: {usr.id.substring(0, 8)}...</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="py-4 px-5 text-sm text-muted font-medium">{usr.email || '---'}</td>
                                <td className="py-4 px-5 text-center">
                                   <span className={cn(
                                     "text-xs font-mono px-2.5 py-1 rounded-full tracking-widest border uppercase transition-all inline-flex items-center gap-1.5",
                                     usr.role === 'admin' ? 'bg-purple/10 text-purple border-purple/20' :
                                     usr.role === 'approved' ? 'bg-green/10 text-green border-green/20' :
                                     'bg-amber/10 text-amber border-amber/20 animate-pulse'
                                   )}>
                                     <div className={cn(
                                       "w-1.5 h-1.5 rounded-full",
                                       usr.role === 'admin' ? 'bg-purple' :
                                       usr.role === 'approved' ? 'bg-green' :
                                       'bg-amber'
                                     )} />
                                     {usr.role === 'admin' ? 'Admin' : usr.role === 'approved' ? 'Ativo' : 'Pendente'}
                                   </span>
                                </td>
                                <td className="py-4 px-5 text-center">
                                   <select
                                     value={usr.role}
                                     onChange={(e) => updateUserRole(usr.id, e.target.value)}
                                     className="bg-surface border border-white/10 rounded-md px-2 py-1.5 text-xs font-medium text-text outline-none cursor-pointer hover:border-white/20 transition-all appearance-none text-center min-w-[100px]"
                                   >
                                     <option value="admin">Admin</option>
                                     <option value="approved">Aprovado</option>
                                     <option value="pending">Pendente</option>
                                   </select>
                                </td>
                                <td className="py-4 px-5 text-right">
                                   <div className="flex justify-end gap-1.5">
                                      {usr.role === 'pending' && (
                                        <button 
                                          onClick={() => updateUserRole(usr.id, 'approved')} 
                                          className="px-3 py-1.5 bg-green/10 text-green border border-green/20 rounded-md text-xs font-medium hover:bg-green/20 transition-all flex items-center gap-1.5"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5"/>
                                          Aprovar
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => deleteUserDoc(usr.id)} 
                                        disabled={deleteUserLoading === usr.id}
                                        className="p-1.5 bg-surface border border-white/5 rounded text-muted hover:text-red hover:border-red/20 hover:bg-red/5 transition-all disabled:opacity-50"
                                      >
                                        {deleteUserLoading === usr.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                                      </button>
                                   </div>
                                </td>
                             </tr>
                           ));
                         })()}
                      </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {addUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-white/10 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
                  <h3 className="text-lg font-medium text-text flex items-center gap-2"><UserPlus className="w-5 h-5 text-accent"/> Adicionar Usuário</h3>
                  <button onClick={() => setAddUserModalOpen(false)} className="text-muted hover:text-text transition-colors"><X className="w-5 h-5"/></button>
               </div>
               <div className="p-5 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider mb-1.5 block">Nome completo</label>
                    <input 
                      type="text" 
                      value={newUserNome} 
                      onChange={e => setNewUserNome(e.target.value)} 
                      placeholder="Nome do colaborador" 
                      className="w-full bg-bg/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-medium text-text outline-none focus:border-accent/50 transition-all placeholder:text-muted/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider mb-1.5 block">E-mail</label>
                    <input 
                      type="email" 
                      value={newUserEmail} 
                      onChange={e => setNewUserEmail(e.target.value)} 
                      placeholder="email@tripla.com.br" 
                      className="w-full bg-bg/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-medium text-text outline-none focus:border-accent/50 transition-all placeholder:text-muted/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider mb-1.5 block">Senha</label>
                    <input 
                      type="password" 
                      value={newUserPassword} 
                      onChange={e => setNewUserPassword(e.target.value)} 
                      placeholder="Mínimo 6 caracteres" 
                      className="w-full bg-bg/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-medium text-text outline-none focus:border-accent/50 transition-all placeholder:text-muted/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted uppercase tracking-wider mb-1.5 block">Permissão</label>
                    <select 
                      value={newUserRole} 
                      onChange={e => setNewUserRole(e.target.value as 'approved' | 'admin')}
                      className="w-full bg-bg/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-medium text-text outline-none focus:border-accent/50 transition-all cursor-pointer"
                    >
                      <option value="approved">Usuário Aprovado</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {addUserError && (
                    <div className="bg-red/10 border border-red/20 rounded-lg p-3">
                      <p className="text-red text-sm font-medium">{addUserError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button 
                      onClick={() => setAddUserModalOpen(false)} 
                      className="flex-1 bg-surface border border-white/10 text-muted font-medium py-2.5 rounded-lg text-sm hover:text-text hover:border-white/20 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAddUser} 
                      disabled={addUserLoading}
                      className="flex-1 bg-accent text-white font-medium py-2.5 rounded-lg text-sm hover:bg-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {addUserLoading && <Loader2 className="w-4 h-4 animate-spin"/>}
                      {addUserLoading ? 'Criando...' : 'Criar Usuário'}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ======================= CONFIGURACOES TAB ======================= */}
        {activeTab === 'Configuracoes' && (
          <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
               <h2 className="text-2xl font-medium text-text flex items-center gap-3 tracking-tight"><Lock className="w-6 h-6 text-accent"/> Governança e Configurações</h2>
               <p className="text-sm font-mono text-muted mt-2 tracking-widest uppercase">Gestão de Usuários, Permissões de Acesso e Importação de Dados</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
               
               {/* Access Approval Card */}
               <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 rounded-xl p-6 flex flex-col h-[350px] transition-all duration-300">
                  <h3 className="text-sm font-mono text-text uppercase tracking-widest flex items-center gap-2 mb-2">
                     <ShieldAlert className="w-5 h-5 text-red"/> Aprovação de Acessos
                  </h3>
                  <p className="text-sm font-mono text-muted uppercase tracking-wider mb-6">Contas @tripla aguardando liberação do sistema central.</p>
                  
                  <div className="flex-1 bg-surface border border-white/5 rounded-lg overflow-y-auto p-3 custom-scrollbar">
                     {pendingUsers.length > 0 ? pendingUsers.map(u => (
                        <div key={u.id} className="flex flex-col gap-2 bg-bg/50 border border-white/5 rounded-md p-3 mb-2 group transition-all">
                           <span className="font-medium text-text text-sm truncate">{u.email}</span>
                           <button onClick={() => approveUser(u.id)} className="bg-green text-white px-3 py-1.5 rounded font-medium text-sm hover:bg-green/80 transition-all text-center">Liberar Acesso Full</button>
                        </div>
                     )) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted gap-3 opacity-60">
                           <CheckCircle className="w-6 h-6" />
                           <p className="text-sm font-mono uppercase tracking-widest">Nenhuma Pendência</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Organizer Management Card */}
               <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 rounded-xl p-6 flex flex-col h-[350px] transition-all duration-300">
                  <h3 className="text-sm font-mono text-text uppercase tracking-widest flex items-center gap-2 mb-2">
                     <Users className="w-5 h-5 text-accent"/> Organizadores Padrão
                  </h3>
                  <p className="text-sm font-mono text-muted uppercase tracking-wider mb-6">Defina os gestores responsáveis disponíveis para seleção.</p>
                  
                  <div className="flex gap-2 mb-4">
                     <input type="text" value={novoOrgName} onChange={e => setNovoOrgName(e.target.value)} placeholder="Nome do gestor..." className="flex-1 bg-surface border border-white/5 rounded-md px-3 py-1.5 outline-none text-sm font-medium text-text focus:border-white/20 transition-all placeholder:text-muted" />
                     <button onClick={addOrganizador} className="bg-text text-bg font-medium px-3 py-1.5 rounded-md text-sm hover:bg-text/80 transition-all">
                        ADD
                     </button>
                  </div>

                  <div className="flex-1 bg-surface border border-white/5 rounded-lg overflow-y-auto p-3 custom-scrollbar space-y-2">
                     {organizadores.length > 0 ? organizadores.map(org => (
                        <div key={org.id} className="flex justify-between items-center bg-bg/50 border border-white/5 rounded-md p-2.5 transition-all">
                           <span className="font-medium text-text text-sm truncate">{org.nome}</span>
                           <button onClick={() => deleteOrganizador(org.id)} className="text-muted hover:text-red transition-all p-1 hover:bg-red/10 rounded"><Trash2 className="w-5 h-5"/></button>
                        </div>
                     )) : (
                        <div className="text-center p-6 text-muted/60 font-mono text-sm uppercase tracking-widest">Nenhum responsável configurado.</div>
                     )}
                  </div>
               </div>

               {/* Bulk Import Card */}
               <div className="bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-white/5 rounded-xl p-6 flex flex-col h-[350px] transition-all duration-300">
                  <h3 className="text-sm font-mono text-text uppercase tracking-widest flex items-center gap-2 mb-2">
                     <FolderUp className="w-5 h-5 text-green"/> Importação Massiva
                  </h3>
                  <p className="text-sm font-mono text-muted uppercase tracking-wider mb-6">Sincronize o calendário via planilha estruturada (.CSV).</p>
                  
                  <div className="flex items-center justify-center gap-2 w-full border border-white/5 border-dashed hover:border-white/20 bg-surface text-muted hover:text-accent rounded-lg py-10 transition-all mb-4 cursor-pointer group">
                     <div className="flex flex-col items-center gap-3">
                        <UploadCloud className="w-6 h-6 group-hover:-translate-y-1 transition-transform"/>
                        <span className="text-sm font-mono uppercase tracking-widest">Upload .CSV</span>
                     </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                     <button className="text-accent hover:text-accent/80 font-medium text-sm px-3 py-2 rounded-md transition-all w-full flex items-center justify-center gap-2 uppercase tracking-widest bg-accent/10">
                       <Download className="w-5 h-5"/> Template .CSV
                     </button>
                     <button className="bg-surface text-muted/40 cursor-not-allowed font-medium py-2 rounded-md text-sm transition-all w-full flex justify-center items-center gap-2 uppercase tracking-widest border border-white/5">
                        Iniciar Processamento
                     </button>
                  </div>
               </div>

            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
