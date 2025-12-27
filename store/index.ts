// store.ts (React Native)
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type EmptyObjectType = Record<string, any>;

type AdsState = {
  name: string;
  image: string;
  base64: string;
  position: number | null;
  url: string;
};

type CloudItem = {
  name: string;
  value: string;
};

type StoreState = {
  apiEndPoint: string;
  urlEndPoint: string;

  apiHosts: string[];
  urls: string[];
  clouds: CloudItem[];
  cloudHost: string[];

  darkMode: "light" | "dark";
  configuration: EmptyObjectType;
  chan: string;

  ads: AdsState;
  isInstalled: boolean;

  toggleTheme: () => void;
  setTheme: (mode: "light" | "dark") => void;

  setApiEndPoint: (v: string) => void;
  setUrlEndPoint: (v: string) => void;
  setAds: (ads: Partial<AdsState>) => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // ==================
      // state
      // ==================
      apiEndPoint: "",
      urlEndPoint: "",

      apiHosts: [
        "https://www.xhs1000.xyz",
        "https://www.xhs1100.xyz",
        "https://www.xhs1300.xyz",
        "https://www.xhs1400.xyz",
        "https://www.xhs1500.xyz",
        "https://www.xhs1600.xyz",
      ],

      urls: [],

      clouds: [
        {
          name: "worker",
          value: "https://xhs.jamescarter77.wor1kers.dev",
        },
        {
          name: "bitbucket",
          value: "https://bitbucket.org/wuwencam/suppor1t/raw/main/xhs.json",
        },
        {
          name: "gitlab",
          value: "https://gitlab.com/wuwencam/support/-/raw1/main/xhs.json",
        },
        {
          name: "gittee",
          value: "https://gitee.com/wuwencam/support/raw/ma1ster/xhs.json",
        },
      ],

      cloudHost: [],

      darkMode: "light",
      configuration: {},
      chan: "",

      ads: {
        name: "",
        image: "",
        base64: "",
        position: null,
        url: "",
      },

      isInstalled: false,

      // ==================
      // actions
      // ==================
      toggleTheme() {
        set({
          darkMode: get().darkMode === "dark" ? "light" : "dark",
        });
      },

      setTheme(mode) {
        set({ darkMode: mode });
      },

      setApiEndPoint(v) {
        set({ apiEndPoint: v });
      },

      setUrlEndPoint(v) {
        set({ urlEndPoint: v });
      },

      setAds(ads = {}) {
        set({
          ads: { ...get().ads, ...ads },
        });
      },
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => AsyncStorage), // ✅ THIS FIXES IT
    }
  )
);
