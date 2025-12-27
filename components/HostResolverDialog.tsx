import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLoggerStore } from "../store/logger";
import { useApiHosts } from "../hooks/useApiHost";

/* -----------------------------
 * Props (Vue v-model → RN)
 * --------------------------- */
type Props = {
  visible: boolean;
  onChangeVisible: (v: boolean) => void;
};

export default function HostResolverDialog({
  visible,
  onChangeVisible,
}: Props) {
  const logs = useLoggerStore((s) => s.logs);
  const loading = useApiHosts().loading;

  const scrollRef = useRef<ScrollView>(null);

  /* -----------------------------
   * Auto scroll to bottom on log update
   * --------------------------- */
  useEffect(() => {
    if (!visible) return;

    // small delay to ensure layout is ready
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 30);
  }, [logs.length, visible]);

  function close() {
    onChangeVisible(false);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>API Host Resolving…</Text>
            {loading && <ActivityIndicator size="small" color="#2563eb" />}
          </View>

          {/* Log box */}
          <ScrollView
            ref={scrollRef}
            style={styles.logBox}
            contentContainerStyle={styles.logContent}
          >
            {logs.map((line, i) => (
              <Text key={i} style={styles.logLine}>
                {line}
              </Text>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.closeBtn} onPress={close}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "90%",
    maxWidth: 500,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  logBox: {
    maxHeight: 200,
    marginBottom: 12,
  },

  logContent: {
    paddingVertical: 4,
  },

  logLine: {
    fontSize: 12,
    color: "#e5e7eb",
    marginBottom: 4,
  },

  actions: {
    alignItems: "flex-end",
  },

  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#2563eb",
  },

  closeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
