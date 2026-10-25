import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { RootStackParamList } from '../../App';
import { apiFetch, type NearbyVet } from '../lib/api';
import { PILOT_COMMUNES } from '../lib/format';
import { authToken } from '../lib/pocketbase';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const RADIUS_OPTIONS = [5, 10, 20] as const;
const DEFAULT_CENTER = PILOT_COMMUNES[0];

export function HomeScreen({ navigation }: Props) {
  const [center, setCenter] = useState<{ lat: number; lon: number }>({ lat: DEFAULT_CENTER.lat, lon: DEFAULT_CENTER.lon });
  const [hasLocation, setHasLocation] = useState<boolean | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [vets, setVets] = useState<NearbyVet[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchVets = useCallback(async (lat: number, lon: number, radius: number) => {
    const res = await apiFetch<NearbyVet[]>(
      `/api/search/vets?lat=${lat}&lon=${lon}&radius_km=${radius}&service=home_visit`,
      authToken(),
    );
    if (res.success && res.data) {
      setVets(res.data);
      setError(null);
    } else {
      setError(res.error ?? 'Error al buscar veterinarios');
    }
  }, []);

  // Ubicación una sola vez; si se niega, el tutor elige su comuna del piloto.
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setHasLocation(false);
      const pos = await Location.getCurrentPositionAsync({});
      setCenter({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setHasLocation(true);
    })().catch(() => setHasLocation(false));
  }, []);

  useEffect(() => {
    void searchVets(center.lat, center.lon, radiusKm);
  }, [center, radiusKm, searchVets]);

  const region = { latitude: center.lat, longitude: center.lon, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  const openVet = (vet: NearbyVet) => navigation.navigate('VetProfile', { vetId: vet.vet_id });

  return (
    <View style={styles.container}>
      {hasLocation === false && (
        <View style={styles.bar}>
          <Text style={styles.barLabel}>Tu comuna:</Text>
          {PILOT_COMMUNES.map((c) => {
            const isActive = center.lat === c.lat && center.lon === c.lon;
            return (
              <TouchableOpacity key={c.name} accessibilityRole="button" accessibilityState={{ selected: isActive }}
                style={[styles.chip, isActive && styles.chipActive]} onPress={() => setCenter({ lat: c.lat, lon: c.lon })}>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <View style={styles.bar}>
        <Text style={styles.barLabel}>Radio:</Text>
        {RADIUS_OPTIONS.map((r) => (
          <TouchableOpacity key={r} accessibilityRole="button" accessibilityState={{ selected: radiusKm === r }}
            style={[styles.chip, radiusKm === r && styles.chipActive]} onPress={() => setRadiusKm(r)}>
            <Text style={[styles.chipText, radiusKm === r && styles.chipTextActive]}>{r} km</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <MapView style={styles.map} region={region} showsUserLocation={hasLocation === true}>
        {vets.filter((v) => v.lat != null && v.lon != null).map((vet) => (
          <Marker
            key={vet.vet_id}
            coordinate={{ latitude: vet.lat as number, longitude: vet.lon as number }}
            title={vet.full_name}
            description={`${vet.distance_km} km · ver perfil`}
            onCalloutPress={() => openVet(vet)}
          />
        ))}
      </MapView>

      <FlatList
        style={styles.list}
        data={vets}
        keyExtractor={(v) => v.vet_id}
        ListEmptyComponent={<Text style={styles.empty}>Aún no hay veterinarios en este radio.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.vetRow} onPress={() => openVet(item)} accessibilityRole="button">
            <Text style={styles.vetName}>{item.full_name}</Text>
            <Text style={styles.vetMeta}>{item.distance_km} km · Verificado</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7faf8' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10 },
  barLabel: { color: '#15211c', fontSize: 13, fontWeight: '600' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d8f3e5' },
  chipActive: { backgroundColor: '#177f56', borderColor: '#177f56' },
  chipText: { color: '#15211c', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  map: { height: 260, marginTop: 10 },
  list: { flex: 1 },
  vetRow: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 12 },
  vetName: { fontSize: 16, fontWeight: '600', color: '#0a3d2b' },
  vetMeta: { fontSize: 13, color: '#177f56', marginTop: 2 },
  empty: { padding: 20, textAlign: 'center', color: '#15211c' },
  error: { color: '#b91c1c', padding: 12, textAlign: 'center' },
});
