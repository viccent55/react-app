import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ChatCustomer, { type ChatCustomerRef } from "../ChatWidget";

/* -----------------------------
 * Props (Vue → RN)
 * --------------------------- */
type Props = {
  errorMsg: string | null;
  allFailed: boolean;
  devModeEnabled: boolean;
  onOpenDevLog: () => void;
};

export default function StartupErrorScreen({
  errorMsg,
  allFailed,
  devModeEnabled,
  onOpenDevLog,
}: Props) {
  const chatRef = useRef<ChatCustomerRef | null>(null);

  function handleLiveTalkClick() {
    console.log("用户点击了联系客服反馈问题领取奖励");
    chatRef.current?.open();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* subtle pulsing background */}
      <View style={styles.glowBackground} />

      <View style={styles.centerBox}>
        {/* Error title */}
        <Text style={styles.errorTitle}>{errorMsg || "未找到可用线路"}</Text>

        {/* Error subtitle */}
        {allFailed && (
          <Text style={styles.errorSubtitle}>
            无法连接到任何线路，可能是网络问题或线路被封锁。
          </Text>
        )}

        {/* Reward / support card */}
        <View style={styles.rewardCard}>
          <Text style={styles.rewardTitle}>线路异常？反馈问题领奖励</Text>

          <Text style={styles.rewardText}>
            如果您多次尝试仍无法进入，请点击下方按钮联系客服，告诉我们您遇到的问题。
            {"\n"}
            我们会尽快为您排查，并赠送奖励作为感谢。
          </Text>

          <Pressable style={styles.primaryButton} onPress={handleLiveTalkClick}>
            <Text style={styles.primaryButtonText}>立即联系客服，反馈问题</Text>
          </Pressable>

          {/* Chat widget (hidden UI, imperative open) */}
          <ChatCustomer ref={chatRef} user={{}} />
        </View>

        {/* Dev-only log button */}
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

  /* pulse background replacement for ::before */
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
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ff6b6b",
    textAlign: "center",
  },

  errorSubtitle: {
    fontSize: 13,
    opacity: 0.85,
    color: "#fff",
    textAlign: "center",
  },

  /* reward card */
  rewardCard: {
    maxWidth: 360,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#111827",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },

  rewardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff",
  },

  rewardText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
    color: "#fff",
  },

  primaryButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  devBtn: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  devBtnText: {
    fontSize: 12,
    color: "#e5e7eb",
  },
});
