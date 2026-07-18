import { useAuth } from '@clerk/clerk-expo';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { RootStackParamList } from '../../App';
import { apiFetch, type NearbyVet } from '../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const RADIUS_OPTIONS = [5, 10, 20, 50] as const;

export function HomeScreen({ navigation }: Props) {
  const { getToken } = useAuth();
  const [region, setRegion] = useState({
    latitude: -33.4489, // Santiago fallback
    longitude: -70.6693,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [vets, setVets] = useState<NearbyVet[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchVets = useCallback(
    async (lat: number, lon: number, radius: number) => {
      const token = await getToken();
      const res = await apiFetch<NearbyVet[]>(
        `/api/search/vets?lat=${lat}&lon=${lon}&radius_km=${radius}`,
        token,
      );
      if (res.success && res.data) {
        setVets(res.data);
        setError(null);
      } else {
        setError(res.error ?? 'Error al buscar veterinarios');
      }
    },
    [getToken],
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = pos.coords;
      setRegion((r) => ({ ...r, latitude, longitude }));
      await searchVets(latitude, longitude, radiusKm);
    })();
  }, [radiusKm, searchVets]);

  return (
    <View style={styles.container}>
      <View style={styles.radiusBar}>
        {RADIUS_OPTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
            onPress={() => setRadiusKm(r)}
          >
            <Text style={[styles.radiusText, radiusKm === r && styles.radiusTextActive]}>
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <MapView style={styles.map} region={region}>
        {vets.map((vet) => (
          <Marker
            key={vet.vet_id}
            coordinate={region /* TODO(FASE 2): usar coordenadas reales del vet */}
            title={vet.full_name}
            description={`${vet.distance_km} km · ${vet.clinic_name ?? 'Domicilio'}`}
            onCalloutPress={() => navigation.navigate('VetProfile', { vetId: vet.vet_id })}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  radiusBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#f7faf8',
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8f3e5',
  },
  radiusChipActive: { backgroundColor: '#177f56', borderColor: '#177f56' },
  radiusText: { color: '#15211c', fontSize: 14 },
  radiusTextActive: { color: '#fff', fontWeight: '600' },
  map: { flex: 1 },
  error: { color: '#b91c1c', padding: 12, textAlign: 'center' },
});
