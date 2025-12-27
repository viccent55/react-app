import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useCustomerService, type ChatUser } from "../hooks/useCostomerService";

/* -----------------------------
 * Exposed ref API (Vue defineExpose)
 * --------------------------- */
export type ChatCustomerRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  user?: ChatUser;
};

/* -----------------------------
 * Component
 * --------------------------- */
const ChatWidget = forwardRef<ChatCustomerRef, Props>(
  ({ user = {} as ChatUser }, ref) => {
    const { buildChatUrl } = useCustomerService();

    const [visible, setVisible] = useState(false);
    const [url, setUrl] = useState<string | string>("");

    /* ---------------------------
     * Expose methods (Vue → RN)
     * ------------------------- */
    useImperativeHandle(ref, () => ({
      open() {
        
        const chatUrl = buildChatUrl(user);
        console.log("chatUrl:", chatUrl);
        if (!chatUrl) return;
        setUrl(chatUrl);
        setVisible(true);
      },
      close() {
        setVisible(false);
      },
    }));

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)} // Android back
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          <SafeAreaView style={styles.panel}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>在线客服</Text>
              <Pressable
                onPress={() => setVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            {/* Body */}
            <View style={styles.body}>
              {url}
              {url && (
                <WebView
                  source={{ uri: url }}
                  style={styles.webview}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  }
);

export default ChatWidget;
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },

  panel: {
    width: 360,
    maxWidth: "100%",
    height: 540,
    maxHeight: "90%",
    backgroundColor: "#111827",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    marginHorizontal: 12,
    marginBottom: 12,
  },

  header: {
    height: 44,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    fontSize: 22,
    color: "#fff",
  },

  body: {
    flex: 1,
    backgroundColor: "#000",
  },

  webview: {
    flex: 1,
  },
});
