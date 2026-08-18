"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RouteResult } from "@workspace/metro-core/types";

export interface RecentRouteEntry {
  id: string;
  from: string;
  to: string;
  route: RouteResult;
  timestamp: number;
  count: number;
}

interface RecentRoutesStore {
  routes: RecentRouteEntry[];
  addRoute: (from: string, to: string, route: RouteResult) => void;
  removeRoute: (id: string) => void;
  clearRoutes: () => void;
}

const MAX_RECENT_ROUTES = 10;

export const useRecentRoutesStore = create<RecentRoutesStore>()(
  persist(
    (set) => ({
      routes: [],
      addRoute: (from, to, route) =>
        set((state) => {
          const id = `${from}-${to}`;
          const existing = state.routes.find((r) => r.id === id);
          const next: RecentRouteEntry = {
            id,
            from,
            to,
            route,
            timestamp: Date.now(),
            count: (existing?.count ?? 0) + 1,
          };
          const rest = state.routes.filter((r) => r.id !== id);
          return { routes: [next, ...rest].slice(0, MAX_RECENT_ROUTES) };
        }),
      removeRoute: (id) =>
        set((state) => ({ routes: state.routes.filter((r) => r.id !== id) })),
      clearRoutes: () => set({ routes: [] }),
    }),
    { name: "recent-routes" }
  )
);
