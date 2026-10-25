import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { formatClp, formatDate, SERVICE_LABEL, STATUS_LABEL } from '../lib/format';
import { authToken } from '../lib/pocketbase';

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  price_clp: number | null;
  pet_name: string | null;
  service_kind: string | null;
  vet_name: string | null;
}

const isOpen = (a: Appointment) => a.status === 'pending' || a.status === 'confirmed';

export function MyAppointmentsScreen() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<Appointment[]>('/api/appointments', authToken());
    if (!res.success) return setError(res.error ?? 'No pudimos cargar tus citas');
    setError(null);
    setItems([...(res.data ?? [])].sort((a, b) =>
      `${b.scheduled_date} ${b.scheduled_time}`.localeCompare(`${a.scheduled_date} ${a.scheduled_time}`)));
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function cancel(a: Appointment) {
    Alert.alert('Cancelar visita', `¿Cancelar la visita de ${a.pet_name ?? 'tu mascota'}?`, [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar visita',
        style: 'destructive',
        onPress: async () => {
          const res = await apiFetch(`/api/appointments/${a.id}/status`, authToken(), {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' }),
          });
          if (!res.success) setError(res.error ?? 'No se pudo cancelar');
          void load();
        },
      },
    ]);
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      ListEmptyComponent={<Text style={styles.empty}>Aún no tienes citas.</Text>}
      renderItem={({ item: a }) => (
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.date}>{formatDate(a.scheduled_date)} · {a.scheduled_time}</Text>
            <Text style={styles.status}>{STATUS_LABEL[a.status] ?? a.status}</Text>
          </View>
          <Text style={styles.title}>{a.pet_name} · {SERVICE_LABEL[a.service_kind ?? ''] ?? 'Servicio'}</Text>
          <Text style={styles.meta}>{a.vet_name} · {formatClp(a.price_clp)}</Text>
          {isOpen(a) && (
            <TouchableOpacity accessibilityRole="button" style={styles.cancel} onPress={() => cancel(a)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7faf8' },
  content: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 15, fontWeight: '700', color: '#0a3d2b' },
  status: { fontSize: 12, fontWeight: '600', color: '#126546', backgroundColor: '#d8f3e5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  title: { fontSize: 15, fontWeight: '600', color: '#15211c', marginTop: 8 },
  meta: { fontSize: 13, color: '#4b5d55', marginTop: 2 },
  cancel: { alignSelf: 'flex-start', marginTop: 12, borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  cancelText: { color: '#b91c1c', fontWeight: '600' },
  empty: { padding: 24, textAlign: 'center', color: '#15211c' },
  error: { color: '#b91c1c', marginBottom: 8 },
});
