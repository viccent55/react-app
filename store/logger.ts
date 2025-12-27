// store/logger.ts

import { create } from "zustand";

type LoggerState = {
  logs: string[];
  log: (msg: string) => void;
  clear: () => void;
};

export const useLoggerStore = create<LoggerState>((set) => ({
  logs: [],

  log(msg) {
    console.log("[LOG]", msg);
    set((state) => ({
      logs: [...state.logs, msg],
    }));
  },

  clear() {
    set({ logs: [] });
  },
}));
