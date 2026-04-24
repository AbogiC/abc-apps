import { reload, sendEmailVerification } from 'firebase/auth';
import { auth } from './firebaseService';

export async function sendCurrentUserEmailVerification() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('Missing authenticated user.');
  }

  if (!currentUser.email) {
    throw new Error('Current user does not have an email address.');
  }

  await sendEmailVerification(currentUser);
  await reload(currentUser);

  return {
    email: currentUser.email,
    emailVerified: currentUser.emailVerified,
  };
}
