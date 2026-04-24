export const userProfile = {
  name: 'Alexander Mitchell',
  title: 'Premium Member',
  avatar: null, // We'll use initials
  memberSince: '2022',
  level: 'Diamond',
  points: 15420,
  nextLevel: 20000,
};

export const statsData = [
  { id: 1, title: 'Portfolio Value', value: '$845,290', change: '+12.5%', icon: 'trending-up', positive: true },
  { id: 2, title: 'Monthly Income', value: '$42,800', change: '+8.3%', icon: 'dollar-sign', positive: true },
  { id: 3, title: 'Active Projects', value: '12', change: '+2', icon: 'briefcase', positive: true },
  { id: 4, title: 'Tasks Due', value: '8', change: '-3', icon: 'check-circle', positive: false },
];

export const recentActivities = [
  { id: 1, title: 'Project Alpha Completed', time: '2 hours ago', type: 'success', icon: 'check-circle' },
  { id: 2, title: 'New Investment Added', time: '5 hours ago', type: 'info', icon: 'trending-up' },
  { id: 3, title: 'Meeting with CEO', time: 'Yesterday', type: 'warning', icon: 'users' },
  { id: 4, title: 'Quarterly Report Generated', time: '2 days ago', type: 'primary', icon: 'file-text' },
  { id: 5, title: 'System Update Available', time: '3 days ago', type: 'danger', icon: 'alert-circle' },
];

export const chartData = {
  weekly: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [65, 72, 68, 75, 82, 78, 85],
    }],
  },
  monthly: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      data: [280, 310, 295, 342],
    }],
  },
};

export const quickActions = [
  { id: 1, title: 'Transfer', icon: 'send', color: '#e94560' },
  { id: 2, title: 'Invest', icon: 'trending-up', color: '#4caf50' },
  { id: 3, title: 'Analytics', icon: 'bar-chart-2', color: '#2196f3' },
  { id: 4, title: 'Settings', icon: 'settings', color: '#ff9800' },
];

export const goals = [
  { id: 1, title: 'Investment Goal', current: 75000, target: 100000, color: '#e94560' },
  { id: 2, title: 'Project Milestones', current: 8, target: 12, color: '#4caf50' },
  { id: 3, title: 'Learning Hours', current: 45, target: 60, color: '#2196f3' },
];