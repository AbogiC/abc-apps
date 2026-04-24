import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import DashboardCard from '../components/DashboardCard';
import StatCard from '../components/StatCard';
import ActivityItem from '../components/ActivityItem';
import ChartView from '../components/ChartView';
import { 
  userProfile, 
  statsData, 
  recentActivities, 
  chartData,
  quickActions,
  goals 
} from '../data/sampleData';

export default function DashboardScreen() {
  const progressPercentage = (userProfile.points / userProfile.nextLevel) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{userProfile.name}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="bell" size={22} color={Colors.gold} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userProfile.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Level Progress */}
        <View style={styles.levelContainer}>
          <View style={styles.levelInfo}>
            <View style={styles.levelBadge}>
              <Feather name="award" size={16} color={Colors.gold} />
              <Text style={styles.levelText}>{userProfile.level}</Text>
            </View>
            <Text style={styles.pointsText}>{userProfile.points.toLocaleString()} / {userProfile.nextLevel.toLocaleString()} pts</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map(action => (
            <TouchableOpacity key={action.id} style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Feather name={action.icon} size={20} color={action.color} />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {statsData.map(stat => (
            <StatCard key={stat.id} {...stat} />
          ))}
        </View>

        {/* Performance Chart */}
        <DashboardCard title="Performance Analytics">
          <ChartView data={chartData} />
        </DashboardCard>

        {/* Goals */}
        <DashboardCard title="Goals & Progress">
          {goals.map(goal => (
            <View key={goal.id} style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalProgress}>
                  {Math.round((goal.current / goal.target) * 100)}%
                </Text>
              </View>
              <View style={styles.goalBar}>
                <View 
                  style={[
                    styles.goalBarFill, 
                    { 
                      width: `${(goal.current / goal.target) * 100}%`,
                      backgroundColor: goal.color 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.goalNumbers}>
                {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
              </Text>
            </View>
          ))}
        </DashboardCard>

        {/* Recent Activities */}
        <DashboardCard title="Recent Activities">
          {recentActivities.map(activity => (
            <ActivityItem key={activity.id} {...activity} />
          ))}
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Activities</Text>
            <Feather name="arrow-right" size={16} color={Colors.gold} />
          </TouchableOpacity>
        </DashboardCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  greeting: {
    color: Colors.gray,
    fontSize: 14,
    marginBottom: 4,
  },
  name: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelContainer: {
    marginTop: 5,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    color: Colors.gold,
    fontWeight: '600',
    fontSize: 14,
  },
  pointsText: {
    color: Colors.gray,
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  goalItem: {
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  goalProgress: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  goalBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalNumbers: {
    color: Colors.gray,
    fontSize: 11,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
  },
  viewAllText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 30,
  },
});