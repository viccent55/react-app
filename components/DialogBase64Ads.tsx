import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../store";

/* -----------------------------
 * Props (Vue props → TS props)
 * --------------------------- */
type Props = {
  visible: boolean;                // v-model
  duration?: number;               // seconds
  autoClose?: boolean;
  appChannel: string;
  onChangeVisible: (v: boolean) => void;
  onClickAd?: (url: string | null) => void;
};

export default function DialogBase64Ads({
  visible,
  duration = 5,
  autoClose = false,
  appChannel,
  onChangeVisible,
  onClickAd,
}: Props) {
  const ads = useStore((s) => s.ads);
  const insets = useSafeAreaInsets();

  const [canClose, setCanClose] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* -----------------------------
   * Helpers
   * --------------------------- */
  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startCountdown() {
    clearTimer();

    if (duration <= 0) {
      setCanClose(true);
      setRemaining(0);
      if (autoClose) onChangeVisible(false);
      return;
    }

    let count = duration;
    setCanClose(false);
    setRemaining(count);

    timerRef.current = setInterval(() => {
      count -= 1;
      setRemaining(Math.max(count, 0));

      if (count <= 0) {
        clearTimer();
        setCanClose(true);
        if (autoClose) onChangeVisible(false);
      }
    }, 1000);
  }

  /* -----------------------------
   * Effects (Vue watch)
   * --------------------------- */
  useEffect(() => {
    if (visible && ads.base64) {
      startCountdown();
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [visible, ads.base64]);

  /* -----------------------------
   * Actions
   * --------------------------- */
  function closeAd() {
    if (!canClose) return;
    onChangeVisible(false);
  }

  function handleClickAd() {
    const url = ads.url || null;
    onClickAd?.(url);

    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  }

  if (!ads.base64) return null;

  /* -----------------------------
   * Render
   * --------------------------- */
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        {/* Close / countdown */}
        <View
          style={[
            styles.closeWrapper,
            {
              top: insets.top + 10,
              right: insets.right + 15,
            },
          ]}
        >
          {!canClose ? (
            <View style={styles.countdownChip}>
              <Text style={styles.countdownText}>
                广告倒计时：{remaining}s
              </Text>
            </View>
          ) : (
            <Pressable style={styles.closeBtn} onPress={closeAd}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Fullscreen image */}
        <Pressable style={styles.imageWrapper} onPress={handleClickAd}>
          <Image
            source={{ uri: ads.base64 }}
            resizeMode="cover"
            style={styles.image}
          />
        </Pressable>

        {/* Channel info */}
        {!canClose && (
          <View
            style={[
              styles.channelWrapper,
              { bottom: insets.bottom + 10 },
            ]}
          >
            <View style={styles.channelChip}>
              <Text style={styles.channelText}>{appChannel}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* -----------------------------
 * Styles (SCSS → StyleSheet)
 * --------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  imageWrapper: {
    flex: 1,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  closeWrapper: {
    position: "absolute",
    zIndex: 10,
    alignItems: "flex-end",
  },

  countdownChip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
  },

  countdownText: {
    color: "#fff",
    fontSize: 14,
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    fontSize: 18,
    color: "#000",
  },

  channelWrapper: {
    position: "absolute",
    right: 10,
    zIndex: 10,
  },

  channelChip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
  },

  channelText: {
    color: "#fff",
    fontSize: 14,
  },
});
