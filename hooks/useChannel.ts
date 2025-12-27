import { useCallback, useState } from "react";
import { Platform, NativeModules } from "react-native";

type NativeChannelModule = {
  getChannel?: () => string;
};

// Native module injected by Android (VAS / custom bridge)
const { NativeChannel } = NativeModules as {
  NativeChannel?: NativeChannelModule;
};

export function useChannel() {
  const [appChannel, setAppChannel] = useState<string>("");

  const getChannel = useCallback(async (): Promise<string> => {
    // Web (Expo web or dev)
    if (Platform.OS === "web") {
      setAppChannel("web");
      return "web";
    }

    // Android native
    if (Platform.OS === "android") {
      try {
        const channel =
          NativeChannel?.getChannel?.() ?? "default-channel";

        setAppChannel(channel);
        return channel;
      } catch (e) {
        console.error("[Channel] getChannel failed:", e);
        setAppChannel("error");
        return "error";
      }
    }

    // iOS or others
    setAppChannel("default");
    return "default";
  }, []);

  return {
    appChannel, // ✅ state
    getChannel, // ✅ async getter
  };
}
