"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BrokenStationsStore {
  /** Station ids the user marked as closed / out of service */
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useBrokenStationsStore = create<BrokenStationsStore>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id],
        })),
      remove: (id) =>
        set((state) => ({ ids: state.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
    }),
    { name: "broken-stations" }
  )
);
