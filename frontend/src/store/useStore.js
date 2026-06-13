import { create } from "zustand";

const useStore = create((set) => ({
  // Auth
  user:  null,
  token: localStorage.getItem("token") || null,
  role:  localStorage.getItem("role")  || null,

  setAuth: (user, token, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role",  role);
    set({ user, token, role });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    set({ user: null, token: null, role: null });
  },

  // Current exam session
  currentSession: null,
  setSession: (session) => set({ currentSession: session }),

  // Results
  lastResult: null,
  setResult: (result) => set({ lastResult: result }),

  // Agent events feed
  agentEvents: [],
  addAgentEvent: (event) =>
    set((state) => ({
      agentEvents: [event, ...state.agentEvents].slice(0, 100)
    })),
  clearAgentEvents: () => set({ agentEvents: [] }),
}));

export default useStore;