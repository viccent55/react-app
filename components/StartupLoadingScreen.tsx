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
      {/* subtle pulsing background */}
      <View style={styles.glowBackground} />

      <View style={styles.centerBox}>
        <Text style={styles.title}>
          {loading ? "正在检测可用线路…" : "正在准备应用…"}
        </Text>

        <ActivityIndicator size="large" color="#2563eb" />

        <Text style={styles.subtitle}>
          正在为您寻找最快、最稳定的线路，请稍候…
        </Text>

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

  /* pseudo-element replacement */
  glowBackground: {
    position: "absolute",
    width: "220%",
    height: "220%",
    top: "-60%",
    left: "-60%",
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    borderRadius: 9999,
    opacity: 0.6,
    transform: [{ scale: 1 }],
  },

  centerBox: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    opacity: 0.8,
    color: "#fff",
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
