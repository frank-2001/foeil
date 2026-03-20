import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initDatabase } from '../src/database/db';
import { Home, Landmark, FolderSync, ReceiptText } from 'lucide-react-native';
import { Colors } from '../src/utils/theme';

export default function Layout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch(console.error);
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.paper,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 10,
        },
        headerStyle: {
          backgroundColor: Colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'FOEIL',
          tabBarLabel: 'aAccueil',
          tabBarIcon: ({ color }: { color: string }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarLabel: 'Flux',
          tabBarIcon: ({ color }: { color: string }) => <ReceiptText color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projets',
          tabBarLabel: 'Projets',
          tabBarIcon: ({ color }: { color: string }) => <Landmark color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Synchronisation',
          tabBarLabel: 'Sync',
          tabBarIcon: ({ color }: { color: string }) => <FolderSync color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
