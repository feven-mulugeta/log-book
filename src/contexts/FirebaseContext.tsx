import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const ROOT_ADMIN_EMAIL = 'feven.mulugeta@aau.edu.et';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isRootAdmin: boolean;
  isSigningIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOutGoogle: () => Promise<void>;
  clearAuthError: () => void;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  user: null,
  authReady: false,
  isRootAdmin: false,
  isSigningIn: false,
  authError: null,
  signInWithGoogle: async () => null,
  signOutGoogle: async () => {},
  clearAuthError: () => {},
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: any) {
      const msg =
        err?.code === 'auth/popup-closed-by-user'
          ? 'Google sign-in popup was closed before finishing.'
          : err?.message || 'Failed to sign in with Google.';
      setAuthError(msg);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutGoogle = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      setAuthError(err?.message || 'Sign out failed.');
    }
  };

  const isRootAdmin = Boolean(
    user && user.emailVerified && user.email?.toLowerCase() === ROOT_ADMIN_EMAIL
  );

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        isRootAdmin,
        isSigningIn,
        authError,
        signInWithGoogle,
        signOutGoogle,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebaseAuth() {
  return useContext(FirebaseContext);
}
