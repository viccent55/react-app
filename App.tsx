import React, { useCallback, useEffect, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

import { useStore } from "./store";
import { useApiHosts } from "./hooks/useApiHost";
import { useReport } from "./hooks/useReport";
import { useChannel } from "./hooks/useChannel";

import DialogBase64Ads from "./components/DialogBase64Ads";
import StartupLoadingScreen from "./components/StartupLoadingScreen";
import StartupErrorScreen from "./components/StartScreen/StartupErrorScreen";
import StartupSuccessScreen from "./components/StartScreen/StartupSuccessScreen";
import HostResolverDialog from "./components/HostResolverDialog";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔒 Prevent splash auto-hide ASAP (top-level, once)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  /* ----------------------------
   * Stores & hooks
   * ---------------------------- */
  const store = useStore();
  const { initApiHosts, loading, failedHosts, failedClouds } = useApiHosts();
  const { runOncePerDay, getFirstVisitInApp } = useReport();
  const { getChannel, appChannel } = useChannel();

  /* ----------------------------
   * Local state
   * ---------------------------- */
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAds, setShowAds] = useState(false);
  const [showResolverDialog, setShowResolverDialog] = useState(false);

  // Prevent ads from showing more than once per app launch
  const adsShownRef = useRef(false);

  const hasHost = !!store.urlEndPoint;
  const allFailed =
    ready && !hasHost && (failedHosts.length > 0 || failedClouds.length > 0);

  /* =================================================
   * 1️⃣ BOOTSTRAP (runs behind splash)
   * ================================================= */
  useStore.persist.clearStorage();
  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        useStore.persist.clearStorage();

        const channel = await getChannel();

        const host = await initApiHosts();
        if (!host || !store.apiEndPoint) {
          setErrorMsg("No available lines found");
        }

        // 🔹 Non-blocking background tasks
        getFirstVisitInApp(channel).catch(() => {});
        runOncePerDay(channel).catch(() => {});
      } catch {
        setErrorMsg("Network error");
      } finally {
        if (mounted) setReady(true);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  /* =================================================
   * 2️⃣ AUTO-SHOW ADS (THIS WAS THE MISSING PIECE)
   * ================================================= */
  useEffect(() => {
    if (ready && store.ads.base64 && !adsShownRef.current) {
      adsShownRef.current = true;
      setShowAds(true);
    }
  }, [ready, store.ads.base64]);

  /* =================================================
   * 3️⃣ Hide splash ONLY after layout + ready
   * ================================================= */
  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync();
    }
  }, [ready]);

  // ⚠️ Do NOT render anything until ready,
  // otherwise splash/layout timing can break
  if (!ready) return null;

  /* =================================================
   * 4️⃣ Render
   * ================================================= */
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#000" }}
        onLayout={onLayoutRootView}
      >
        {/* ================= Ads dialog ================= */}
        {store.ads.base64 && (
          <DialogBase64Ads
            appChannel={appChannel}
            visible={showAds}
            duration={5}
            autoClose
            onChangeVisible={setShowAds}
          />
        )}

        {/* ================= Startup loading ================= */}
        {!store.ads.base64 && loading && (
          <StartupLoadingScreen
            loading={loading}
            devModeEnabled
            onOpenDevLog={() => setShowResolverDialog(true)}
          />
        )}

        {/* ================= Error screen ================= */}
        {!hasHost && !loading && (
          <StartupErrorScreen
            errorMsg={errorMsg}
            allFailed={allFailed}
            devModeEnabled
            onOpenDevLog={() => setShowResolverDialog(true)}
          />
        )}

        {/* ================= Success / WebView ================= */}
        {hasHost && (
          <StartupSuccessScreen
            urlEndPoint={store.urlEndPoint}
            apiEndPoint={store.apiEndPoint}
            showWebview
          />
        )}

        {/* ================= Dev resolver dialog ================= */}
        <HostResolverDialog
          visible={showResolverDialog}
          onChangeVisible={setShowResolverDialog}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
