import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RootStackParamList } from '../../App';
import { apiFetch } from '../lib/api';
import { pb } from '../lib/pocketbase';

type Props = NativeStackScreenProps<RootStackParamList, 'VetProfile'>;

interface VetProfile {
  id: string;
  full_name: string;
  clinic_name: string | null;
  clinic_address: string | null;
  bio: string | null;
  rating: number | null;
  offers_home_visits: boolean;
  offers_clinic_visits: boolean;
  availability: Array<{
    weekday: number;
    start_time: string;
    end_time: string;
    service_type: 'home_visit' | 'clinic_visit';
    price_clp: number;
  }>;
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function VetProfileScreen({ route }: Props) {
  const [vet, setVet] = useState<VetProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch<VetProfile>(
        `/api/vets/${route.params.vetId}`,
        pb.authStore.isValid ? pb.authStore.token : null,
      );
      if (res.success && res.data) setVet(res.data);
      else setError(res.error ?? 'Error al cargar perfil');
    })();
  }, [route.params.vetId]);

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!vet) return <Text style={styles.loading}>Cargando…</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{vet.full_name}</Text>
      {vet.clinic_name && <Text style={styles.clinic}>{vet.clinic_name}</Text>}
      {vet.rating != null && <Text style={styles.rating}>⭐ {vet.rating} / 5</Text>}
      {vet.bio && <Text style={styles.bio}>{vet.bio}</Text>}

      <View style={styles.badges}>
        {vet.offers_home_visits && <Text style={styles.badge}>🏠 Domicilio</Text>}
        {vet.offers_clinic_visits && <Text style={styles.badge}>🏥 Consultorio</Text>}
      </View>

      <Text style={styles.sectionTitle}>Disponibilidad y precios</Text>
      {vet.availability.map((slot, i) => (
        <View key={i} style={styles.slot}>
          <Text style={styles.slotDay}>{WEEKDAYS[slot.weekday]}</Text>
          <Text style={styles.slotTime}>
            {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
          </Text>
          <Text style={styles.slotService}>
            {slot.service_type === 'home_visit' ? 'Domicilio' : 'Consultorio'}
          </Text>
          <Text style={styles.slotPrice}>${slot.price_clp.toLocaleString('es-CL')}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.bookButton}>
        {/* TODO(FASE 2): pantalla de agendamiento con date/time picker */}
        <Text style={styles.bookButtonText}>Agendar cita</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7faf8' },
  content: { padding: 20 },
  name: { fontSize: 24, fontWeight: '700', color: '#0a3d2b' },
  clinic: { fontSize: 16, color: '#177f56', marginTop: 2 },
  rating: { fontSize: 16, marginTop: 8 },
  bio: { fontSize: 15, color: '#15211c', marginTop: 12, lineHeight: 22 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: {
    backgroundColor: '#d8f3e5',
    color: '#126546',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 13,
    overflow: 'hidden',
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  slot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  slotDay: { fontWeight: '600', width: 40 },
  slotTime: { color: '#15211c' },
  slotService: { color: '#177f56' },
  slotPrice: { fontWeight: '600' },
  bookButton: {
    backgroundColor: '#177f56',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#b91c1c', padding: 20, textAlign: 'center' },
  loading: { padding: 20, textAlign: 'center', color: '#15211c' },
});
