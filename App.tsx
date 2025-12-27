/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect, useState } from 'react';
import { NewAppScreen } from '@react-native/new-app-screen';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  NativeModules,
  Text,
} from 'react-native';
import RNBootSplash from 'react-native-bootsplash';

console.log(NativeModules.Channel);

import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // ✅ HIDE SPLASH HERE (IMPORTANT)
  useEffect(() => {
    RNBootSplash.hide({ fade: true });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [channel, setChannel] = useState<string>('loading...');

  useEffect(() => {
    async function loadChannel() {
      try {
        const ch = await NativeModules.Channel.getChannel();
        setChannel(ch);
      } catch {
        setChannel('error');
      }
    }
    loadChannel();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
          paddingLeft: safeAreaInsets.left,
          paddingRight: safeAreaInsets.right,
        },
      ]}
    >
      <Text style={styles.channelText}>{channel}</Text>

      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  channelText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default App;
