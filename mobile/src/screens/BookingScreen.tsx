import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { RootStackParamList } from '../../App';
import { apiFetch, totalPrice, type VetService } from '../lib/api';
import { formatClp, formatDate, newIdempotencyKey, SERVICE_LABEL, upcomingDates } from '../lib/format';
import { authToken } from '../lib/pocketbase';

type Props = NativeStackScreenProps<RootStackParamList, 'Booking'>;
interface Pet { id: string; name: string }

function Chip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: isSelected }}
      style={[styles.chip, isSelected && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function BookingScreen({ route, navigation }: Props) {
  const { vetId, vetName, services } = route.params;
  const [pets, setPets] = useState<Pet[]>([]);
  const [pet, setPet] = useState<Pet | null>(null);
  const [newPetName, setNewPetName] = useState('');
  const [service, setService] = useState<VetService | null>(services.length === 1 ? services[0]! : null);
  const [dates] = useState(() => upcomingDates());
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    apiFetch<Pet[]>('/api/pets', authToken()).then((res) => setPets(res.data ?? []));
  }, []);

  async function addPet() {
    if (!newPetName.trim()) return;
    const res = await apiFetch<Pet>('/api/pets', authToken(), {
      method: 'POST',
      body: JSON.stringify({ name: newPetName.trim(), species: 'dog' }),
    });
    if (!res.success || !res.data) return setError(res.error ?? 'No pudimos guardar tu mascota');
    setPets((p) => [res.data!, ...p]);
    setPet(res.data);
    setNewPetName('');
  }

  async function chooseDate(d: string) {
    setDate(d);
    setTime(null);
    const res = await apiFetch<{ slots: string[] }>(`/api/vets/${vetId}/slots?date=${d}&service_type=home_visit`, authToken());
    setSlots(res.data?.slots ?? []);
  }

  function chooseTime(t: string) {
    setTime(t);
    setIdempotencyKey(newIdempotencyKey()); // nuevo intento: los reintentos del mismo no duplican
  }

  async function confirm() {
    if (!pet || !service || !date || !time) return;
    setIsBusy(true);
    setError(null);
    const res = await apiFetch('/api/appointments', authToken(), {
      method: 'POST',
      body: JSON.stringify({
        pet_id: pet.id, vet_id: vetId, service_id: service.id, service_type: 'home_visit',
        scheduled_date: date, scheduled_time: time, idempotency_key: idempotencyKey,
      }),
    });
    setIsBusy(false);
    if (res.success) return navigation.replace('MyAppointments');
    setError(res.error ?? 'No pudimos confirmar la reserva');
    if (res.error?.includes('horario')) void chooseDate(date);
  }

  const isReady = pet && service && date && time;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Visita con {vetName}</Text>

      <Text style={styles.section}>1. Mascota</Text>
      <View style={styles.wrap}>
        {pets.map((p) => <Chip key={p.id} label={p.name} isSelected={pet?.id === p.id} onPress={() => setPet(p)} />)}
      </View>
      <View style={styles.addRow}>
        <TextInput style={styles.input} placeholder="Agregar mascota (nombre)" value={newPetName}
          onChangeText={setNewPetName} maxLength={100} accessibilityLabel="Nombre de la nueva mascota" />
        <TouchableOpacity style={styles.addButton} onPress={addPet} accessibilityRole="button">
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>2. Servicio</Text>
      <View style={styles.wrap}>
        {services.map((s) => (
          <Chip key={s.id} label={`${SERVICE_LABEL[s.kind] ?? s.kind} · ${formatClp(totalPrice(s))}`}
            isSelected={service?.id === s.id} onPress={() => setService(s)} />
        ))}
      </View>

      <Text style={styles.section}>3. Día</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dates}>
        {dates.map((d) => <Chip key={d} label={formatDate(d)} isSelected={date === d} onPress={() => chooseDate(d)} />)}
      </ScrollView>

      {date && (
        <>
          <Text style={styles.section}>4. Hora</Text>
          {slots.length === 0 && <Text style={styles.muted}>No quedan horarios este día.</Text>}
          <View style={styles.wrap}>
            {slots.map((t) => <Chip key={t} label={t} isSelected={time === t} onPress={() => chooseTime(t)} />)}
          </View>
        </>
      )}

      {isReady && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{pet!.name} · {SERVICE_LABEL[service!.kind]}</Text>
          <Text style={styles.summaryText}>{formatDate(date!)} a las {time}</Text>
          <Text style={styles.total}>Total: {formatClp(totalPrice(service!))}</Text>
          <Text style={styles.muted}>Pagas al veterinario al terminar. Puedes cancelar sin costo antes de la hora.</Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity accessibilityRole="button" style={[styles.confirm, (!isReady || isBusy) && styles.confirmDisabled]}
        disabled={!isReady || isBusy} onPress={confirm}>
        <Text style={styles.confirmText}>{isBusy ? 'Confirmando…' : 'Confirmar reserva'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7faf8' },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#0a3d2b' },
  section: { fontSize: 15, fontWeight: '700', color: '#0a3d2b', marginTop: 22, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dates: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d8f3e5' },
  chipActive: { backgroundColor: '#177f56', borderColor: '#177f56' },
  chipText: { color: '#15211c', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#d8f3e5' },
  addButton: { justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#177f56' },
  addButtonText: { color: '#177f56', fontWeight: '600' },
  summary: { marginTop: 24, backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4 },
  summaryText: { fontSize: 15, color: '#15211c' },
  total: { fontSize: 20, fontWeight: '700', color: '#0a3d2b', marginTop: 6 },
  muted: { fontSize: 13, color: '#4b5d55', marginTop: 4 },
  error: { color: '#b91c1c', marginTop: 16 },
  confirm: { backgroundColor: '#177f56', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  confirmDisabled: { backgroundColor: '#9bbfb0' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
