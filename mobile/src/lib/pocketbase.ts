import * as SecureStore from 'expo-secure-store';
import PocketBase, { AsyncAuthStore } from 'pocketbase';

// La sesión (JWT) se guarda en el llavero del sistema (Keychain / Keystore),
// no en AsyncStorage, que queda en texto plano en el dispositivo.
const KEY = 'pb_auth';

const store = new AsyncAuthStore({
  save: async (serialized) => SecureStore.setItemAsync(KEY, serialized),
  initial: SecureStore.getItemAsync(KEY).then((v) => v ?? ''),
  clear: async () => SecureStore.deleteItemAsync(KEY),
});

export const pb = new PocketBase(process.env.EXPO_PUBLIC_POCKETBASE_URL, store);

export const authToken = (): string | null => (pb.authStore.isValid ? pb.authStore.token : null);
