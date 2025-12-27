// composables/useCustomerService.ts (React Native SAFE)

import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ChatUser {
  id?: string | number;
  nickname?: string;
  avatar?: string;
  phone?: string;
  vipLevel?: number | string;
  visitCode?: string | number;
}

const DEVICE_ID_KEY = "STATISTICS_DEVICE_ID";
const DEFAULT_CHAT_URL = "https://livetalk.xhltfes.com";
const GROUP_ID = "1";

export function useCustomerService() {
  const buildChatUrl = async (user: ChatUser): Promise<string | null> => {
    try {
      const CHAT_WIDGET_URL =
        process.env.EXPO_PUBLIC_CHAT_WIDGET_URL || DEFAULT_CHAT_URL;

      /* --------------------------------
       * Device / visitor ID
       * -------------------------------- */
      const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      const rawId = user?.id ?? storedDeviceId ?? "guest";

      const visitorId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.MD5,
        String(rawId)
      );

      /* --------------------------------
       * Extra user info
       * -------------------------------- */
      const extraObj = {
        visitorName: user?.nickname,
        visitorAvatar: user?.avatar,
        userId: user?.id,
        phone: user?.phone,
        vipLevel: user?.vipLevel,
      };

      const extra = encodeURIComponent(JSON.stringify(extraObj));

      /* --------------------------------
       * Refer (RN has no window.location)
       * -------------------------------- */
      const referUrl = (await Linking.getInitialURL()) ?? "";
      const refer = encodeURIComponent(referUrl);

      /* --------------------------------
       * Build final URL
       * -------------------------------- */
      return (
        `${CHAT_WIDGET_URL}/livechat` +
        `?group_id=${GROUP_ID}` +
        `&visitor_id=${visitorId}` +
        `&extra=${extra}` +
        `&refer=${refer}`
      );
    } catch (e) {
      console.error("[Chat] buildChatUrl failed:", e);
      return null;
    }
  };

  return { buildChatUrl };
}
