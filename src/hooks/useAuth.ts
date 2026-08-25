import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  signOut as firebaseSignOut,
  type User,
  type AuthError,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getDb } from '@/lib/firebase';
import { generateAnonymousName } from '@/lib/utils';
import type { UserProfile } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              isAnonymous: firebaseUser.isAnonymous,
              displayName: generateAnonymousName(firebaseUser.uid),
              reviewCount: 0,
              createdAt: Date.now(),
            };
            await setDoc(doc(getDb(), 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.warn('Failed to load/create user profile:', err);
        }
      } else {
        try {
          const cred = await signInAnonymously(getFirebaseAuth());
          setUser(cred.user);
        } catch (err) {
          console.error('Anonymous auth failed:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isLinkedWithGoogle = user?.providerData.some((p) => p.providerId === 'google.com') ?? false;

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(getFirebaseAuth(), provider);

      if (user && user.isAnonymous) {
        try {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential) {
            await linkWithCredential(user, credential);
          }
        } catch {
          // Already linked or different account — proceed with Google account
        }
      }

      const firebaseUser = getFirebaseAuth().currentUser;
      if (firebaseUser) {
        const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
        const updateData: Partial<UserProfile> = {
          isAnonymous: false,
          photoURL: firebaseUser.photoURL || undefined,
          linkedProvider: 'google.com',
          linkedAt: Date.now(),
        };

        if (firebaseUser.displayName) {
          updateData.displayName = firebaseUser.displayName;
        }

        if (userDoc.exists()) {
          await updateDoc(doc(getDb(), 'users', firebaseUser.uid), updateData);
        } else {
          await setDoc(doc(getDb(), 'users', firebaseUser.uid), {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || generateAnonymousName(firebaseUser.uid),
            reviewCount: 0,
            createdAt: Date.now(),
            ...updateData,
          });
        }

        setProfile((prev) => prev ? { ...prev, ...updateData } : null);
      }

      return { success: true };
    } catch (err) {
      const authError = err as AuthError;
      if (authError.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'تم إلغاء التسجيل' };
      }
      if (authError.code === 'auth/account-exists-with-different-credential') {
        return { success: false, error: 'الحساب موجود ببيانات دخول مختلفة' };
      }
      console.error('Google sign-in failed:', err);
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  }, [user]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await firebaseSignOut(getFirebaseAuth());
      // signInAnonymously will fire via onAuthStateChanged listener
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }, []);

  return { user, profile, loading, isLinkedWithGoogle, signInWithGoogle, signOut };
}
