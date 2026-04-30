import { create } from 'zustand';
import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { TriplaEvent } from '@/types/evento';
import { genericConverter } from '@/lib/firebaseUtils';

interface EventsState {
  events: TriplaEvent[];
  loading: boolean;
  searchQuery: string;
  selectedResps: string[];
  selectedTipos: string[];
  selectedStatus: string[];
  selectedFormatos: string[];
  showPastEvents: boolean;
  filterStartDate: string;
  filterEndDate: string;
  
  selectedEvent: TriplaEvent | null;
  setSelectedEvent: (ev: TriplaEvent | null) => void;
  isEditingEvent: boolean;
  setIsEditingEvent: (val: boolean) => void;
  
  isCommentsPanelOpen: boolean;
  setIsCommentsPanelOpen: (val: boolean) => void;
  eventForComments: TriplaEvent | null;
  setEventForComments: (ev: TriplaEvent | null) => void;

  isActivityModalOpen: boolean;
  setIsActivityModalOpen: (val: boolean) => void;
  
  fetchEvents: () => Promise<void>;
  setSearchQuery: (q: string) => void;
  toggleResp: (resp: string) => void;
  toggleTipo: (tipo: string) => void;
  toggleStatus: (st: string) => void;
  toggleFormato: (formato: string) => void;
  setShowPastEvents: (val: boolean) => void;
  setFilterStartDate: (val: string) => void;
  setFilterEndDate: (val: string) => void;
}

export const useEvents = create<EventsState>((set) => ({
  events: [],
  loading: false,
  searchQuery: '',
  selectedResps: [],
  selectedTipos: [],
  selectedStatus: [],
  selectedFormatos: [],
  showPastEvents: false,
  filterStartDate: '',
  filterEndDate: '',
  selectedEvent: null,
  isEditingEvent: false,
  isCommentsPanelOpen: false,
  eventForComments: null,
  isActivityModalOpen: false,

  setSelectedEvent: (ev) => set({ selectedEvent: ev }),
  setIsEditingEvent: (val) => set({ isEditingEvent: val }),
  setIsCommentsPanelOpen: (val) => set({ isCommentsPanelOpen: val }),
  setEventForComments: (ev) => set({ eventForComments: ev, isCommentsPanelOpen: !!ev }),
  setIsActivityModalOpen: (val) => set({ isActivityModalOpen: val }),

  fetchEvents: async () => {
    set({ loading: true });
    try {
      const db = getFirebaseDb();
      if (!db) { set({ loading: false }); return; }
      
      const querySnapshot = await getDocs(
        collection(db, "eventos").withConverter(genericConverter<TriplaEvent>())
      );
      const eventsList = querySnapshot.docs.map(doc => doc.data());
      
      set({ events: eventsList, loading: false });
    } catch (err) {
      console.error("Erro ao buscar eventos do Firebase:", err);
      set({ loading: false });
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  
  toggleResp: (resp) => set((state) => {
    const list = state.selectedResps;
    if (list.includes(resp)) {
      return { selectedResps: list.filter(r => r !== resp) };
    } else {
      return { selectedResps: [...list, resp] };
    }
  }),
  
  toggleTipo: (tipo) => set((state) => {
    const list = state.selectedTipos;
    return { selectedTipos: list.includes(tipo) ? list.filter(t => t !== tipo) : [...list, tipo] };
  }),

  toggleStatus: (st) => set((state) => {
    const list = state.selectedStatus;
    return { selectedStatus: list.includes(st) ? list.filter(s => s !== st) : [...list, st] };
  }),

  toggleFormato: (formato) => set((state) => {
    const list = state.selectedFormatos;
    return { selectedFormatos: list.includes(formato) ? list.filter(f => f !== formato) : [...list, formato] };
  }),
  
  setShowPastEvents: (val) => set({ showPastEvents: val }),
  setFilterStartDate: (val) => set({ filterStartDate: val }),
  setFilterEndDate: (val) => set({ filterEndDate: val }),
}));
