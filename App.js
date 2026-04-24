import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from './src/theme/colors';
import DashboardScreen from './src/screens/DashboardScreen';
import NotesScreen from './src/screens/NotesScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import ContemplationScreen from './src/screens/ContemplationScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout' },
  { key: 'notes', label: 'Notes', icon: 'edit-3' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar' },
  { key: 'contemplation', label: 'Contemplation', icon: 'moon' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

const screens = {
  dashboard: DashboardScreen,
  notes: NotesScreen,
  calendar: CalendarScreen,
  contemplation: ContemplationScreen,
  profile: ProfileScreen,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const ActiveScreen = screens[activeTab];

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <View style={styles.screenArea}>
        <ActiveScreen />
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.85}
            >
              <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                <Feather
                  name={tab.icon}
                  size={18}
                  color={isActive ? Colors.gold : Colors.gray}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 15, 26, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.16)',
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  tabLabel: {
    color: Colors.gray,
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: Colors.gold,
  },
});
