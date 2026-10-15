import { PixelifySans_400Regular, PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PramuatGambar } from '../komponen/pramuat';
import { mulai, useToko } from '../data/toko';
import { siapkanMesin } from '../mesin/sqlite';
import { W } from '../tema';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Akar() {
  const [huruf] = useFonts({ PressStart2P_400Regular, PixelifySans_400Regular, PixelifySans_700Bold, VT323_400Regular });
  const siap = useToko((k) => k.siap);

  useEffect(() => {
    mulai();
    siapkanMesin();
    if (Platform.OS === 'web') {
      document.title = 'SQLidik';
      document.body.style.backgroundColor = W.malam3;
    }
  }, []);

  useEffect(() => {
    if (huruf && siap) SplashScreen.hideAsync().catch(() => {});
  }, [huruf, siap]);

  if (!huruf || !siap) return <View style={{ flex: 1, backgroundColor: W.malam }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: W.malam3 }, animation: 'fade' }} />
      <PramuatGambar />
    </SafeAreaProvider>
  );
}
