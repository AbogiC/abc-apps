import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';

const screenWidth = Dimensions.get('window').width;

export default function ChartView({ data }) {
  const [activeTab, setActiveTab] = useState('weekly');
  const currentData = data[activeTab];
  
  const maxValue = Math.max(...currentData.datasets[0].data);
  const chartWidth = screenWidth - 80;
  
  return (
    <View>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
          onPress={() => setActiveTab('monthly')}
        >
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>Monthly</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.chart}>
        {currentData.datasets[0].data.map((value, index) => {
          const barHeight = (value / maxValue) * 150;
          return (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.barValue}>{value}</Text>
              <View style={[styles.bar, { height: barHeight }]}>
                <View style={styles.barFill} />
              </View>
              <Text style={styles.barLabel}>{currentData.labels[index]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.gold,
  },
  tabText: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.primary,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barValue: {
    color: Colors.gold,
    fontSize: 10,
    marginBottom: 4,
  },
  bar: {
    width: '70%',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: Colors.gold,
    borderRadius: 4,
    height: '100%',
  },
  barLabel: {
    color: Colors.gray,
    fontSize: 10,
    marginTop: 4,
  },
});