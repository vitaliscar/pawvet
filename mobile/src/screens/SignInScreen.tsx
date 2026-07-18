import { useSignIn } from '@clerk/clerk-expo';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSignIn() {
    if (!isLoaded || isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigation.replace('Home');
      } else {
        // TODO(FASE 3): flujo 2FA obligatorio para vets
        setError('Se requiere verificación adicional.');
      }
    } catch {
      setError('Credenciales inválidas.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>🐾</Text>
      <Text style={styles.title}>PAWVET</Text>
      <Text style={styles.subtitle}>Huella Amiga</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={isBusy}>
          <Text style={styles.buttonText}>{isBusy ? 'Ingresando…' : 'Iniciar sesión'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f7faf8' },
  logo: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', color: '#0a3d2b' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#177f56', marginBottom: 32 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d8f3e5',
  },
  button: {
    backgroundColor: '#177f56',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#b91c1c', fontSize: 14 },
});
