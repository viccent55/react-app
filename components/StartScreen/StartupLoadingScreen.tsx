import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* -----------------------------
 * Props (Vue → RN)
 * --------------------------- */
type Props = {
  loading: boolean;
  devModeEnabled: boolean;
  onOpenDevLog: () => void;
};

export default function StartupLoadingScreen({
  loading,
  devModeEnabled,
  onOpenDevLog,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      {/* subtle background glow (replacement for ::before) */}
      <View style={styles.glowBackground} />

      <View style={styles.centerBox}>
        {/* Title */}
        <Text style={styles.loadingTitle}>
          {loading ? "正在检测可用线路…" : "正在准备应用…"}
        </Text>

        {/* Spinner */}
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginVertical: 12 }}
        />

        {/* Subtitle */}
        <Text style={styles.loadingSubtitle}>
          正在为您寻找最快、最稳定的线路，请稍候…
        </Text>

        {/* Dev-only button */}
        {devModeEnabled && (
          <Pressable onPress={onOpenDevLog} style={styles.devBtn}>
            <Text style={styles.devBtnText}>查看线路检测日志</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 10,
  },

  /* replacement for ::before pulse background */
  glowBackground: {
    position: "absolute",
    width: "220%",
    height: "220%",
    top: "-60%",
    left: "-60%",
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    borderRadius: 9999,
    opacity: 0.6,
  },

  centerBox: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },

  loadingSubtitle: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.8,
    textAlign: "center",
  },

  devBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  devBtnText: {
    fontSize: 12,
    color: "#e5e7eb",
  },
});
