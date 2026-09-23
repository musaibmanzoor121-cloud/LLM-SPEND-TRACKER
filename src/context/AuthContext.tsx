import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOutUser } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithToken: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('watchdog_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Exchange or sync Firebase user with backend session
          const res = await fetch('/api/auth/firebase-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: firebaseUser.email,
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
            })
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('watchdog_token', data.token);
            setToken(data.token);
          }
        } catch (err) {
          console.error('Error syncing Firebase user with backend:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogleHandler = async () => {
    setLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        const res = await fetch('/api/auth/firebase-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
          })
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('watchdog_token', data.token);
          setToken(data.token);
        }
      }
    } catch (err) {
      console.error('Failed to log in with Google:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithTokenHandler = (newToken: string) => {
    localStorage.setItem('watchdog_token', newToken);
    setToken(newToken);
  };

  const logoutHandler = async () => {
    try {
      await logOutUser();
    } catch (e) {
      console.warn('Firebase logout warning:', e);
    }
    localStorage.removeItem('watchdog_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithGoogle: loginWithGoogleHandler,
        loginWithToken: loginWithTokenHandler,
        logout: logoutHandler
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
