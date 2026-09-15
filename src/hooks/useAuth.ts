import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signOut as firebaseSignOut,
  type User,
  type UserCredential,
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
        // لقطة مؤقتة قد يبثّها Firebase أثناء دوران الجلسة (لا مستخدم فعلًا):
        // نحاول إنشاء المجهول، ومع فشلٍ عابر (انقطاع Firebase/شبكة) نحاول
        // مرتين بالأثر (L3) — والخروج النهائي بلا user يبقى حيًّا لواجهة
        // القراءة ولا يعلّق الخلاصة إلى الأبد.
        let attempts = 0;
        const tryAnon = async (): Promise<void> => {
          try {
            const cred = await signInAnonymously(getFirebaseAuth());
            setUser(cred.user);
          } catch (err) {
            attempts += 1;
            if (attempts < 3) {
              // backoff تصاعدي (600ms، 1200ms، ثم استسلام)
              setTimeout(() => void tryAnon(), 600 * attempts);
            } else {
              console.error('Anonymous auth failed after retries:', err);
            }
          }
        };
        await tryAnon();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isLinkedWithGoogle = user?.providerData.some((p) => p.providerId === 'google.com') ?? false;

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getFirebaseAuth();
      const current = auth.currentUser;

      // إذا كان هناك مستخدم مجهول قائم: نربط جوجل به عبر linkWithPopup
      // (يرفع الحساب المجهول لنفس uid) — لا نستبدل الهوية أبدًا. بدون مستخدم
      // مجهول حي: تسجيل دخول بوب-أب عادي.
      let result: UserCredential;
      if (current?.isAnonymous) {
        result = await linkWithPopup(current, provider);
      } else {
        result = await signInWithPopup(auth, provider);
      }

      const firebaseUser = result.user;
      if (firebaseUser) {
        const userDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
        // الهوية تبقى «مجهولة» في العرض: الاسم المستعار ثابت من uid، ولا نخزّن
        // الاسم الحقيقي/البريد/الصورة أبدًا (قرار ٥ — «بلا اسمك الحقيقي»).
        const updateData: Partial<UserProfile> = {
          isAnonymous: false,
          displayName: generateAnonymousName(firebaseUser.uid),
          linkedProvider: 'google.com',
          linkedAt: Date.now(),
        };

        if (userDoc.exists()) {
          await updateDoc(doc(getDb(), 'users', firebaseUser.uid), updateData);
        } else {
          await setDoc(doc(getDb(), 'users', firebaseUser.uid), {
            uid: firebaseUser.uid,
            displayName: generateAnonymousName(firebaseUser.uid),
            reviewCount: 0,
            createdAt: Date.now(),
            ...updateData,
          });
        }

        setProfile((prev) =>
          prev
            ? { ...prev, isAnonymous: false, displayName: generateAnonymousName(firebaseUser.uid), linkedProvider: 'google.com', linkedAt: updateData.linkedAt }
            : null
        );
      }

      return { success: true, user: firebaseUser ?? undefined };
    } catch (err) {
      const authError = err as AuthError;
      if (authError.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'تم إلغاء التسجيل' };
      }
      if (authError.code === 'auth/credential-already-in-use') {
        return { success: false, error: 'حساب جوجل هذا مربوط بهوية أخرى — استخدم حسابًا مختلفًا' };
      }
      if (authError.code === 'auth/account-exists-with-different-credential') {
        return { success: false, error: 'الحساب موجود ببيانات دخول مختلفة' };
      }
      console.error('Google sign-in failed:', err);
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  }, []);

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
