import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import DashboardCard from '../components/DashboardCard';
import { Colors } from '../theme/colors';
import { auth } from '../services/firebaseService';
import { sendCurrentUserEmailVerification } from '../services/authVerificationService';
import { emptyProfile, getUserProfile, saveUserProfile } from '../services/userProfileService';

const fallbackSettings = [
  { icon: 'bell', label: 'Notifications' },
  { icon: 'lock', label: 'Privacy' },
  { icon: 'help-circle', label: 'Support' },
];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function formatMemberSince(creationTime) {
  if (!creationTime) {
    return 'Now';
  }

  const date = new Date(creationTime);
  if (Number.isNaN(date.getTime())) {
    return 'Now';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

export default function ProfileScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setProfile(emptyProfile);
        setError('');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const storedProfile = await getUserProfile(user.uid);
        setProfile({
          ...emptyProfile,
          ...storedProfile,
          fullname: storedProfile.fullname || user.displayName || '',
          email: storedProfile.email || user.email || '',
        });
      } catch {
        setError('Could not load your saved profile yet.');
        setProfile({
          ...emptyProfile,
          fullname: user.displayName || '',
          email: user.email || '',
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const displayName = useMemo(() => {
    return profile.fullname || currentUser?.displayName || 'Signed in user';
  }, [profile.fullname, currentUser?.displayName]);

  const displayMemberSince = formatMemberSince(currentUser?.metadata?.creationTime);
  const displayEmail = currentUser?.email || 'No email connected';
  const emailVerified = !!currentUser?.emailVerified;

  const stats = [
    { label: 'Auth', value: currentUser ? 'Connected' : 'Offline' },
    { label: 'UID', value: currentUser?.uid ? `${currentUser.uid.slice(0, 8)}...` : 'None' },
    { label: 'Verified', value: currentUser?.emailVerified ? 'Yes' : 'No' },
  ];

  const handleSaveProfile = async () => {
    if (!currentUser) {
      setError('You need to be signed in to save profile changes.');
      return;
    }

    if (profile.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(profile.dateOfBirth)) {
      setError('Use YYYY-MM-DD for date of birth.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const savedProfile = await saveUserProfile(
        currentUser.uid,
        {
          ...profile,
          email: currentUser.email || profile.email || '',
        },
        {
          updateAuthEmail: false,
        }
      );

      setProfile({
        ...profile,
        ...savedProfile,
        email: currentUser.email || profile.email || '',
      });

      Alert.alert('Profile saved', 'Your profile details were updated successfully.');
    } catch {
      setError('Could not save your profile right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut(auth);
    } catch {
      Alert.alert('Sign out failed', 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      setVerifying(true);
      setError('');

      await sendCurrentUserEmailVerification();
      setCurrentUser({ ...auth.currentUser });
      Alert.alert(
        'Verification sent',
        'We sent a verification link to your email address. Please check your inbox.'
      );
    } catch {
      setError('Could not send the verification email right now.');
    } finally {
      setVerifying(false);
    }
  };

  const updateField = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>Profile</Text>
          <Text style={styles.title}>Your space</Text>
          <Text style={styles.subtitle}>
            {currentUser
              ? 'Edit the details tied to your Firebase account and save them into Firestore.'
              : 'Sign in to edit and save your profile details.'}
          </Text>

          {loading ? (
            <DashboardCard style={styles.loadingCard}>
              <ActivityIndicator color={Colors.gold} />
              <Text style={styles.loadingText}>Loading your account...</Text>
            </DashboardCard>
          ) : (
            <DashboardCard style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              </View>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.role}>
                {currentUser ? 'Firebase authenticated user' : 'Not signed in'}
              </Text>

              <View style={styles.identityBlock}>
                <View style={styles.identityRow}>
                  <Feather name="mail" size={14} color={Colors.gold} />
                  <Text style={styles.identityText}>{displayEmail}</Text>
                </View>
                <View style={styles.identityRow}>
                  <Feather name="calendar" size={14} color={Colors.gold} />
                  <Text style={styles.identityText}>Member since {displayMemberSince}</Text>
                </View>
                <View style={styles.identityRow}>
                  <Feather name={emailVerified ? 'check-circle' : 'alert-circle'} size={14} color={emailVerified ? Colors.success : Colors.warning} />
                  <Text style={styles.identityText}>
                    {emailVerified ? 'Email verified' : 'Email not verified'}
                  </Text>
                </View>
              </View>
            </DashboardCard>
          )}

          <View style={styles.statsRow}>
            {stats.map((item) => (
              <DashboardCard key={item.label} style={styles.statsCard}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </DashboardCard>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <DashboardCard style={styles.formCard}>
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Fullname</Text>
              <View style={styles.inputWrap}>
                <Feather name="user" size={16} color={Colors.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="Alexander Mitchell"
                  placeholderTextColor={Colors.gray}
                  value={profile.fullname}
                  onChangeText={(value) => updateField('fullname', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Nickname</Text>
              <View style={styles.inputWrap}>
                <Feather name="smile" size={16} color={Colors.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="Alex"
                  placeholderTextColor={Colors.gray}
                  value={profile.nickname}
                  onChangeText={(value) => updateField('nickname', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <View style={styles.inputWrap}>
                <Feather name="calendar" size={16} color={Colors.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.gray}
                  value={profile.dateOfBirth}
                  onChangeText={(value) => updateField('dateOfBirth', value)}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.helperText}>Use the format YYYY-MM-DD.</Text>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Phone</Text>
              <View style={styles.inputWrap}>
                <Feather name="phone" size={16} color={Colors.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="+62 812 3456 7890"
                  placeholderTextColor={Colors.gray}
                  value={profile.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={saving || loading || !currentUser}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.saveButtonText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </DashboardCard>

          <Text style={styles.sectionTitle}>Account</Text>
          <DashboardCard style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Feather name={currentUser ? 'shield' : 'log-in'} size={18} color={Colors.gold} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>
                  {currentUser ? 'Firebase sync is active' : 'Authentication needed'}
                </Text>
                <Text style={styles.settingCaption}>
                  {currentUser
                    ? 'Your profile is saved to Firebase Auth and Firestore.'
                    : 'Add a sign-in flow to connect this screen to a real account.'}
                </Text>
              </View>
            </View>
          </DashboardCard>

          {currentUser && !emailVerified ? (
            <TouchableOpacity
              style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
              onPress={handleSendVerification}
              disabled={verifying || loading}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Feather name="mail" size={16} color={Colors.primary} />
                  <Text style={styles.verifyButtonText}>Send verification email</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          {currentUser ? (
            <TouchableOpacity
              style={[styles.signOutButton, signingOut && styles.signOutButtonDisabled]}
              onPress={handleSignOut}
              disabled={signingOut}
              activeOpacity={0.85}
            >
              <Feather name="log-out" size={16} color={Colors.white} />
              <Text style={styles.signOutText}>{signingOut ? 'Signing out...' : 'Sign out'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signOutButton}>
              <Feather name="log-in" size={16} color={Colors.white} />
              <Text style={styles.signOutText}>Add sign-in screen</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Preferences</Text>
          {fallbackSettings.map((item) => (
            <DashboardCard key={item.label} style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <Feather name={item.icon} size={18} color={Colors.gold} />
                </View>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={Colors.gray} />
              </View>
            </DashboardCard>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  kicker: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.gray,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    color: Colors.gray,
    fontSize: 13,
    marginTop: 10,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    marginBottom: 12,
  },
  avatarText: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  role: {
    color: Colors.gray,
    fontSize: 13,
    marginBottom: 14,
    textAlign: 'center',
  },
  identityBlock: {
    width: '100%',
    gap: 10,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  identityText: {
    flex: 1,
    color: Colors.white,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 6,
    gap: 10,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statValue: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    color: Colors.gray,
    fontSize: 12,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 13,
    marginBottom: 8,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  formCard: {
    marginBottom: 12,
  },
  inputBlock: {
    marginBottom: 14,
  },
  inputLabel: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
  },
  helperText: {
    color: Colors.gray,
    fontSize: 11,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.75,
  },
  saveButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.gold,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.75,
  },
  verifyButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  settingCard: {
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingCaption: {
    color: Colors.gray,
    fontSize: 12,
    lineHeight: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
