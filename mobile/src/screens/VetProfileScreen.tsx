import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RootStackParamList } from '../../App';
import { apiFetch, totalPrice, type VetService } from '../lib/api';
import { formatClp, SERVICE_LABEL } from '../lib/format';
import { authToken } from '../lib/pocketbase';

type Props = NativeStackScreenProps<RootStackParamList, 'VetProfile'>;

interface VetProfile {
  id: string;
  full_name: string;
  bio: string | null;
  rating: number | null;
  services: VetService[];
  availability: Array<{ weekday: number; start_time: string; end_time: string; service_type: string }>;
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function VetProfileScreen({ route, navigation }: Props) {
  const [vet, setVet] = useState<VetProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch<VetProfile>(`/api/vets/${route.params.vetId}`, authToken());
      if (res.success && res.data) setVet(res.data);
      else setError(res.error ?? 'Error al cargar perfil');
    })();
  }, [route.params.vetId]);

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!vet) return <Text style={styles.loading}>Cargando…</Text>;

  const homeWindows = vet.availability.filter((s) => s.service_type === 'home_visit');
  const canBook = vet.services.length > 0 && homeWindows.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{vet.full_name}</Text>
      <Text style={styles.badge}>Verificado por PAWVET</Text>
      {vet.rating != null && <Text style={styles.rating}>⭐ {vet.rating} / 5</Text>}
      {vet.bio && <Text style={styles.bio}>{vet.bio}</Text>}

      <Text style={styles.sectionTitle}>Servicios a domicilio</Text>
      {vet.services.length === 0 && <Text style={styles.muted}>Aún no publica servicios.</Text>}
      {vet.services.map((s) => (
        <View key={s.id} style={styles.row}>
          <Text style={styles.rowTitle}>{SERVICE_LABEL[s.kind] ?? s.kind}</Text>
          <Text style={styles.rowPrice}>{formatClp(totalPrice(s))}</Text>
        </View>
      ))}
      <Text style={styles.muted}>Precio final, incluye traslado. Pagas al veterinario al terminar la visita.</Text>

      <Text style={styles.sectionTitle}>Horarios habituales</Text>
      {homeWindows.map((slot, i) => (
        <Text key={`${slot.weekday}-${slot.start_time}-${i}`} style={styles.window}>
          {WEEKDAYS[slot.weekday]} · {slot.start_time}–{slot.end_time}
        </Text>
      ))}

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.bookButton, !canBook && styles.bookButtonDisabled]}
        disabled={!canBook}
        onPress={() => navigation.navigate('Booking', { vetId: vet.id, vetName: vet.full_name, services: vet.services })}
      >
        <Text style={styles.bookButtonText}>{canBook ? 'Agendar visita' : 'Sin horarios disponibles'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7faf8' },
  content: { padding: 20, paddingBottom: 40 },
  name: { fontSize: 24, fontWeight: '700', color: '#0a3d2b' },
  badge: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#d8f3e5', color: '#126546', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '600', overflow: 'hidden' },
  rating: { fontSize: 16, marginTop: 8 },
  bio: { fontSize: 15, color: '#15211c', marginTop: 12, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 8, color: '#0a3d2b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#15211c' },
  rowPrice: { fontSize: 15, fontWeight: '700', color: '#0a3d2b' },
  window: { fontSize: 15, color: '#15211c', paddingVertical: 4 },
  muted: { fontSize: 13, color: '#4b5d55' },
  bookButton: { backgroundColor: '#177f56', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  bookButtonDisabled: { backgroundColor: '#9bbfb0' },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#b91c1c', padding: 20, textAlign: 'center' },
  loading: { padding: 20, textAlign: 'center', color: '#15211c' },
});
