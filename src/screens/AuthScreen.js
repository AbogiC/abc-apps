import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import DashboardCard from '../components/DashboardCard';
import { Colors } from '../theme/colors';
import { auth } from '../services/firebaseService';
import { saveUserProfile } from '../services/userProfileService';

export default function AuthScreen() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const bottomInset = Platform.OS === 'android' ? 24 : 16;
  const scrollRef = useRef(null);
  const inputPositions = useRef({});

  const [mode, setMode] = useState('login');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  const title = useMemo(
    () => (isRegister ? 'Create your account' : 'Welcome back'),
    [isRegister]
  );

  const subtitle = useMemo(
    () =>
      isRegister
        ? 'Set up your Firebase account to sync profile data and unlock your dashboard.'
        : 'Sign in to continue to your tabs, notes, calendar, and profile.',
    [isRegister]
  );

  const resetForm = () => {
    setFullname('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleFieldLayout = (field, event) => {
    inputPositions.current[field] = event.nativeEvent.layout.y;
  };

  const scrollToField = (field) => {
    const fieldY = inputPositions.current[field] ?? 0;
    const targetY = Math.max(0, fieldY - 120);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: targetY,
        animated: true,
      });
    });
  };

  const toggleMode = () => {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
    setError('');
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (isRegister && !fullname.trim()) {
      setError('Please add your name for the profile screen.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (isRegister) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

        if (fullname.trim()) {
          await updateProfile(credential.user, {
            displayName: fullname.trim(),
          });
        }

        await saveUserProfile(
          credential.user.uid,
          {
            fullname: fullname.trim(),
            email: email.trim(),
          },
          { createdAt: new Date().toISOString() }
        );
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (authError) {
      const message =
        authError?.code === 'auth/email-already-in-use'
          ? 'That email is already registered.'
          : authError?.code === 'auth/invalid-email'
            ? 'Please use a valid email address.'
            : authError?.code === 'auth/weak-password'
              ? 'Password should be at least 6 characters.'
              : authError?.code === 'auth/invalid-credential'
                ? 'Email or password is incorrect.'
                : 'Could not complete authentication. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={topInset + 12}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: 180 + bottomInset }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.kicker}>Personal Dashboard</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <DashboardCard style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Feather name={isRegister ? 'user-plus' : 'log-in'} size={18} color={Colors.gold} />
            </View>
            <Text style={styles.heroTitle}>{isRegister ? 'New here?' : 'Returning user?'}</Text>
            <Text style={styles.heroBody}>
              {isRegister
                ? 'Create an account and your profile will sync into Firebase.'
                : 'Sign in and your dashboard will reopen exactly where you left it.'}
            </Text>
          </DashboardCard>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, !isRegister && styles.toggleButtonActive]}
              onPress={() => setMode('login')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isRegister && styles.toggleButtonActive]}
              onPress={() => setMode('register')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          <DashboardCard style={styles.formCard}>
            {isRegister ? (
              <View style={styles.inputBlock} onLayout={(event) => handleFieldLayout('fullname', event)}>
                <Text style={styles.inputLabel}>Full name</Text>
                <View style={styles.inputWrap}>
                  <Feather name="user" size={16} color={Colors.gray} />
                  <TextInput
                    style={styles.input}
                    placeholder="Alexander Mitchell"
                    placeholderTextColor={Colors.gray}
                    value={fullname}
                    onChangeText={setFullname}
                    autoCapitalize="words"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onFocus={() => scrollToField('fullname')}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.inputBlock} onLayout={(event) => handleFieldLayout('email', event)}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrap}>
                <Feather name="mail" size={16} color={Colors.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.gray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => scrollToField('email')}
                />
              </View>
            </View>

            <View style={styles.inputBlock} onLayout={(event) => handleFieldLayout('password', event)}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <Feather name="lock" size={16} color={Colors.gray} />
                <TextInput
                  style={styles.input}
                  placeholder="Your password"
                  placeholderTextColor={Colors.gray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onFocus={() => scrollToField('password')}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isRegister ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </TouchableOpacity>
          </DashboardCard>

          <TouchableOpacity style={styles.switchLink} onPress={toggleMode} activeOpacity={0.85}>
            <Text style={styles.switchLinkText}>
              {isRegister ? 'Already have an account? Log in' : 'Need an account? Register'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={resetForm}
            activeOpacity={0.85}
          >
            <Feather name="refresh-ccw" size={14} color={Colors.gray} />
            <Text style={styles.clearButtonText}>Clear form</Text>
          </TouchableOpacity>
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
  heroCard: {
    alignItems: 'center',
    marginBottom: 14,
  },
  heroBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    marginBottom: 12,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroBody: {
    color: Colors.gray,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.24)',
  },
  toggleText: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: Colors.gold,
  },
  formCard: {
    marginBottom: 14,
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
  errorText: {
    color: Colors.warning,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  switchLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchLinkText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  keyboardSpacer: {
    height: 8,
  },
});
