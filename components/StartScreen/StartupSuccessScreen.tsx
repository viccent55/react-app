import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

/* -----------------------------
 * Props (Vue → RN)
 * --------------------------- */
type Props = {
  urlEndPoint: string;
  apiEndPoint: string;
  showWebview?: boolean;
};

export default function StartupSuccessScreen({
  urlEndPoint,
  apiEndPoint,
  showWebview: defaultShow = false,
}: Props) {
  const [showWebview, setShowWebview] = useState(defaultShow);
  const webviewRef = useRef<WebView>(null);

  function enterHome() {
    setShowWebview(true);
  }

  /* -----------------------------
   * Inject data into WebView
   * (iframe.contentWindow.postMessage → injectJavaScript)
   * --------------------------- */
  function injectWindowKey() {
    const payload = {
      type: "INIT_ENV",
      api: apiEndPoint,
      platform: "react-native",
    };

    const js = `
      (function () {
        window.postMessage(${JSON.stringify(payload)}, "*");
        console.log("✅ INIT_ENV received:", ${JSON.stringify(payload)});
      })();
      true;
    `;

    webviewRef.current?.injectJavaScript(js);
  }
  const [webError, setWebError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* -----------------------------
   * Startup screen
   * --------------------------- */
  if (!showWebview) {
    return (
      <SafeAreaView style={styles.startupContainer}>
        <View style={styles.centerBox}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>线路检测完成</Text>

          <Text style={styles.successSubtitle}>
            已为您找到可用线路：
            {"\n"}
            <Text style={styles.primaryText}>{urlEndPoint}</Text>
          </Text>

          <Pressable style={styles.enterBtn} onPress={enterHome}>
            <Text style={styles.enterBtnText}>进入首页</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* -----------------------------
   * Real WebView
   * --------------------------- */
  return (
    <WebView
      ref={webviewRef}
      source={{ uri: urlEndPoint }}
      style={styles.webview}
      onLoadStart={() => {
        setIsLoading(true);
        setWebError(null);
      }}
      onLoadEnd={() => {
        setIsLoading(false);
        injectWindowKey();
      }}
      onError={(e) => {
        console.error("WebView error:", e.nativeEvent);
        setIsLoading(false);
        setWebError("页面加载失败，线路可能不可用");
      }}
      onHttpError={(e) => {
        console.error("HTTP error:", e.nativeEvent);
        setIsLoading(false);
        setWebError(`服务器错误 (${e.nativeEvent.statusCode})`);
      }}
      javaScriptEnabled
      domStorageEnabled
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      originWhitelist={["*"]}
    />
  );
}
const styles = StyleSheet.create({
  startupContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 10,
  },

  centerBox: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    textAlign: "center",
  },

  successIcon: {
    fontSize: 40,
  },

  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },

  successSubtitle: {
    fontSize: 13,
    opacity: 0.9,
    color: "#fff",
    textAlign: "center",
  },

  primaryText: {
    color: "#2563eb",
  },

  enterBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2563eb",
  },

  enterBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  webviewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
});
