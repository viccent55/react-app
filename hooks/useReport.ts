import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { setConfig } from "../plugin/statistics";
import { useStore } from "../store";

export function useReport() {
  const [isRunning, setIsRunning] = React.useState(false);

  // ✅ Expo public env
  const TRANSACTION_API = process.env.EXPO_PUBLIC_TRANSACTION_API_BASE;

  const store = useStore();

  // ✅ Storage keys
  const DAY_KEY = "last_report_alive";
  const LIFETIME_KEY = "first_install_reported";

  /* --------------------------------
   * Helpers
   * -------------------------------- */

  const shouldRunToday = async (): Promise<boolean> => {
    const last = await AsyncStorage.getItem(DAY_KEY);
    if (!last) return true;

    const lastDate = new Date(last);
    const now = new Date();

    return (
      lastDate.getFullYear() !== now.getFullYear() ||
      lastDate.getMonth() !== now.getMonth() ||
      lastDate.getDate() !== now.getDate()
    );
  };

  /* --------------------------------
   * Run ONCE PER DAY
   * -------------------------------- */
  const runOncePerDay = async (appChannel: string = "") => {
    if (isRunning) return;

    const shouldRun = await shouldRunToday();
    if (!shouldRun) return;

    setIsRunning(true);
    const alreadyReported = await AsyncStorage.getItem(LIFETIME_KEY);
    if (alreadyReported != "1") return;
    try {
      await setConfig({
        appId: "1234567898765432100",
        productId: "xhslandpage",
        backendURL: TRANSACTION_API,
        promoCode: appChannel,
        productCode: "xhslandpage",
        actionType: "click",
      });

      // ✅ Save today's date
      await AsyncStorage.setItem(DAY_KEY, new Date().toISOString());
    } catch (e) {
      console.error("[Report] runOncePerDay failed:", e);
    } finally {
      setIsRunning(false);
    }
  };

  /* --------------------------------
   * Run ONLY ONCE (lifetime install)
   * -------------------------------- */
  const getFirstVisitInApp = async (appChannel: string = "") => {
    const alreadyReported = await AsyncStorage.getItem(LIFETIME_KEY);
    if (alreadyReported === "1") {
      return; // 🔒 already reported
    }

    try {
      await setConfig({
        appId: "1234567898765432100",
        productId: "xhslandpage",
        backendURL: TRANSACTION_API,
        promoCode: appChannel,
        productCode: "xhslandpage",
        actionType: "install",
      });

      // 🔒 Permanent lock
      await AsyncStorage.setItem(LIFETIME_KEY, "1");
    } catch (e) {
      console.error("[Report] first install failed:", e);
    }
  };

  return {
    runOncePerDay,
    getFirstVisitInApp,
  };
}
