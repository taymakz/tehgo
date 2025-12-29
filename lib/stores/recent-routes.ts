import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RouteResult } from '@/types/metro';

interface RecentRoute {
  id: string;
  from: string;
  to: string;
  route: RouteResult;
  timestamp: number;
  count: number;
}

interface RecentRoutesStore {
  routes: RecentRoute[];
  addRoute: (from: string, to: string, route: RouteResult) => void;
  incrementCount: (from: string, to: string) => void;
  removeRoute: (id: string) => void;
  clearRoutes: () => void;
  selectedRoute: RouteResult | null;
  setSelectedRoute: (route: RouteResult | null) => void;
  detailOpen: boolean;
  setDetailOpen: (open: boolean) => void;
}

export const useRecentRoutesStore = create<RecentRoutesStore>()(
  persist(
    (set, get) => ({
      routes: [],
      addRoute: (from: string, to: string, route: RouteResult) => {
        set((state) => {
          const existingIndex = state.routes.findIndex((r) => r.from === from && r.to === to);
          if (existingIndex !== -1) {
            // Increment count and update timestamp
            const updatedRoutes = [...state.routes];
            updatedRoutes[existingIndex] = {
              ...updatedRoutes[existingIndex],
              count: updatedRoutes[existingIndex].count + 1,
              timestamp: Date.now(),
              route, // Update route in case it's different
            };
            // Move to front
            const [updated] = updatedRoutes.splice(existingIndex, 1);
            updatedRoutes.unshift(updated);
            return { routes: updatedRoutes };
          } else {
            // Add new
            const id = `${from}-${to}-${Date.now()}`;
            const newRoute: RecentRoute = {
              id,
              from,
              to,
              route,
              timestamp: Date.now(),
              count: 1,
            };
            return {
              routes: [newRoute, ...state.routes.slice(0, 9)], // Keep last 10
            };
          }
        });
      },
      incrementCount: (from: string, to: string) => {
        set((state) => {
          const existingIndex = state.routes.findIndex((r) => r.from === from && r.to === to);
          if (existingIndex !== -1) {
            const updatedRoutes = [...state.routes];
            updatedRoutes[existingIndex] = {
              ...updatedRoutes[existingIndex],
              count: updatedRoutes[existingIndex].count + 1,
              timestamp: Date.now(),
            };
            // Move to front
            const [updated] = updatedRoutes.splice(existingIndex, 1);
            updatedRoutes.unshift(updated);
            return { routes: updatedRoutes };
          }
          return state;
        });
      },
      removeRoute: (id: string) => {
        set((state) => ({
          routes: state.routes.filter((r) => r.id !== id),
        }));
      },
      clearRoutes: () => {
        set({ routes: [] });
      },
      selectedRoute: null,
      setSelectedRoute: (route) => set({ selectedRoute: route }),
      detailOpen: false,
      setDetailOpen: (open) => set({ detailOpen: open }),
    }),
    {
      name: 'recent-routes',
      partialize: (state) => ({ routes: state.routes }), // Only persist routes
    }
  )
);
