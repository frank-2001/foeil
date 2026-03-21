import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, ReceiptText, Landmark, Plus } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Theme et Database
import { Colors } from './src/utils/theme';
import { initDatabase } from './src/database/db';

// Composants
import { HeaderMenu } from './src/components/Menu/HeaderMenu';
import { TransactionModal } from './src/components/Modals/TransactionModal';
import { NotificationService } from './src/services/NotificationService';

// Ecrans
import HomeScreen from './src/screens/HomeScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import SyncScreen from './src/screens/SyncScreen';
import SourcesScreen from './src/screens/SourcesScreen';
import ObligationsScreen from './src/screens/ObligationsScreen';
import CurrenciesScreen from './src/screens/CurrenciesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TrashScreen from './src/screens/TrashScreen';
import BudgetManagementScreen from './src/screens/BudgetManagementScreen';
import BudgetAlertsScreen from './src/screens/BudgetAlertsScreen';
import StatsScreen from './src/screens/StatsScreen';
import SupportScreen from './src/screens/SupportScreen';
import ProjectDetailsScreen from './src/screens/ProjectDetailsScreen';
import SourceDetailsScreen from './src/screens/SourceDetailsScreen';
import { 
  SavingsSettingsScreen 
} from './src/screens/MenuScreens';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator({ appStyles }: { appStyles: any }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { colors, isDark } = useTheme();

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: 8,
          },
          tabBarStyle: {
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            height: 70,
            borderRadius: 25,
            backgroundColor: colors.paper,
            borderTopWidth: 0,
            paddingBottom: 0,
            // High-end drop shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 16,
            elevation: 20,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontWeight: '900',
            color: colors.ink,
            fontSize: 22,
          },
          headerShadowVisible: false,
          headerRight: () => <HeaderMenu />,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: 'FOEIL',
            tabBarLabel: 'Tableau',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused && appStyles.tabIconActive}>
                <Home stroke={color} size={focused ? 28 : 24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={appStyles.activeDot} />}
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="AddTransaction" 
          component={View} // Placeholder
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setModalVisible(true);
            },
          }}
          options={{
            tabBarLabel: 'Inscrire',
            tabBarIcon: ({ color, focused }) => (
              <View style={appStyles.mainActionBtn}>
                <Plus stroke={colors.paper} size={32} strokeWidth={3} />
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="Transactions" 
          component={TransactionsScreen} 
          options={{
            title: 'Flux Financier',
            tabBarLabel: 'Flux',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused && appStyles.tabIconActive}>
                <ReceiptText stroke={color} size={focused ? 28 : 24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={appStyles.activeDot} />}
              </View>
            ),
          }}
        />
      </Tab.Navigator>

      <TransactionModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </>
  );
}

function MainApp() {
  const { colors, isDark } = useTheme();

  const appStyles = StyleSheet.create({
    tabIconActive: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.accent,
      marginTop: 6,
      position: 'absolute',
      bottom: -12,
    },
    mainActionBtn: {
      width: 60,
      height: 60,
      borderRadius: 20,
      backgroundColor: colors.ink,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40, // High float
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
  });

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontWeight: '800',
            color: colors.ink,
          },
          headerShadowVisible: false,
          headerTintColor: colors.accent,
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          options={{ headerShown: false }} 
        >
          {props => <TabNavigator {...props} appStyles={appStyles} />}
        </Stack.Screen>
        <Stack.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Mes Projets' }} />
        <Stack.Screen name="Sources" component={SourcesScreen} options={{ title: 'Mes Sources' }} />
        <Stack.Screen name="Currencies" component={CurrenciesScreen} options={{ title: 'Mes Devises' }} />
        <Stack.Screen name="Obligations" component={ObligationsScreen} options={{ title: 'Mes Obligations' }} />
        <Stack.Screen name="SavingsSettings" component={SavingsSettingsScreen} options={{ title: "Système d'épargne" }} />
        <Stack.Screen name="Sync" component={SyncScreen} options={{ title: 'Synchronisation' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
        <Stack.Screen name="Trash" component={TrashScreen} options={{ title: 'Corbeille & Historique' }} />
        <Stack.Screen name="BudgetManagement" component={BudgetManagementScreen} options={{ title: 'Gestion Budget' }} />
        <Stack.Screen name="BudgetAlerts" component={BudgetAlertsScreen} options={{ title: 'Alertes Budgétaires' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Statistiques' }} />
        <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support & Développement' }} />
        <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SourceDetails" component={SourceDetailsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    const init = async () => {
      await initDatabase();
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        await NotificationService.scheduleDailyReminders();
      }
    };
    init().catch(console.error);
  }, []);

  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
