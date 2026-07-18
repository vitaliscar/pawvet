import { ClerkProvider } from '@clerk/clerk-expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { HomeScreen } from './src/screens/HomeScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { VetProfileScreen } from './src/screens/VetProfileScreen';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

// Tokens de Clerk en SecureStore (Keychain / EncryptedSharedPreferences)
const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
  VetProfile: { vetId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator initialRouteName="SignIn">
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Vets cercanos' }}
          />
          <Stack.Screen
            name="VetProfile"
            component={VetProfileScreen}
            options={{ title: 'Perfil veterinario' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ClerkProvider>
  );
}
