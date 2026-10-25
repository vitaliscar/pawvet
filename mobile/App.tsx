import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity } from 'react-native';
import type { VetService } from './src/lib/api';
import { BookingScreen } from './src/screens/BookingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MyAppointmentsScreen } from './src/screens/MyAppointmentsScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { VetProfileScreen } from './src/screens/VetProfileScreen';

export type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
  VetProfile: { vetId: string };
  Booking: { vetId: string; vetName: string; services: VetService[] };
  MyAppointments: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'Veterinarios cercanos',
            headerRight: () => (
              <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('MyAppointments')}>
                <Text style={{ color: '#177f56', fontWeight: '600' }}>Mis citas</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen name="VetProfile" component={VetProfileScreen} options={{ title: 'Perfil veterinario' }} />
        <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Agendar visita' }} />
        <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} options={{ title: 'Mis citas' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
