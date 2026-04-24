import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function StatCard({ title, value, change, icon, positive }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name={icon} size={20} color={Colors.gold} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.changeContainer}>
        <Feather 
          name={positive ? 'arrow-up' : 'arrow-down'} 
          size={12} 
          color={positive ? Colors.success : Colors.danger} 
        />
        <Text style={[styles.change, { color: positive ? Colors.success : Colors.danger }]}>
          {change}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    width: '47%',
    marginBottom: 12,
    marginHorizontal: '1.5%',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    color: Colors.gray,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 6,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});