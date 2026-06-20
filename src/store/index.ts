import { create } from 'zustand';

interface AppState {
  currentInstitutionId: string | null;
  setInstitutionId: (id: string) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentInstitutionId: null,
  setInstitutionId: (id) => set({ currentInstitutionId: id }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
