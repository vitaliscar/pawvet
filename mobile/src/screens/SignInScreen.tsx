import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RootStackParamList } from '../../App';
import { pb } from '../lib/pocketbase';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://pawvet.net';

export function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Sesión guardada en el llavero: si sigue vigente, entra directo.
  useEffect(() => {
    pb.collection('users')
      .authRefresh()
      .then(() => {
        if (pb.authStore.record?.role === 'owner') navigation.replace('Home');
      })
      .catch(() => pb.authStore.clear());
  }, [navigation]);

  async function handleSignIn() {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      await pb.collection('users').authWithPassword(email.trim(), password);
    } catch {
      setError('Credenciales inválidas.');
      setIsBusy(false);
      return;
    }
    setIsBusy(false);
    if (pb.authStore.record?.role !== 'owner') {
      pb.authStore.clear();
      return setError(`La app es para tutores. Veterinarios: ingresen en ${WEB_URL}/vet`);
    }
    navigation.replace('Home');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>PAWVET</Text>
      <Text style={styles.subtitle}>Veterinario a domicilio en Providencia y Ñuñoa</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Correo electrónico"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Contraseña"
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={handleSignIn} disabled={isBusy}>
          <Text style={styles.buttonText}>{isBusy ? 'Ingresando…' : 'Iniciar sesión'}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="link" onPress={() => Linking.openURL(`${WEB_URL}/registro`)}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f7faf8' },
  title: { fontSize: 36, fontWeight: '700', textAlign: 'center', color: '#0a3d2b' },
  subtitle: { fontSize: 15, textAlign: 'center', color: '#177f56', marginTop: 4, marginBottom: 32 },
  form: { gap: 12 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#d8f3e5' },
  button: { backgroundColor: '#177f56', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#177f56', textAlign: 'center', fontWeight: '600', marginTop: 8 },
  error: { color: '#b91c1c', fontSize: 14 },
});
