import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  AdminUserProfile,
  UserPermissions,
  SUPER_ADMIN_EMAIL,
} from '../types/rbac';

interface RBACContextType {
  adminUser: User | null;
  userProfile: AdminUserProfile | null;
  permissions: Partial<UserPermissions> | null;
  isSuperAdmin: boolean;
  authReady: boolean;
  profileLoading: boolean;
}

const RBACContext = createContext<RBACContextType>({
  adminUser: null,
  userProfile: null,
  permissions: null,
  isSuperAdmin: false,
  authReady: false,
  profileLoading: false,
});

export function RBACProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AdminUserProfile | null>(null);
  const [permissions, setPermissions] = useState<Partial<UserPermissions> | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const isSuperAdmin = adminUser?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAdminUser(user);

      if (user && user.email !== SUPER_ADMIN_EMAIL) {
        setProfileLoading(true);
        try {
          const q = query(
            collection(db, 'adminUsers'),
            where('email', '==', user.email)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const doc = snap.docs[0];
            const data = doc.data();
            const profile: AdminUserProfile = {
              id: doc.id,
              email: data.email,
              displayName: data.displayName,
              status: data.status,
              createdAt: data.createdAt?.toDate() ?? new Date(),
              updatedAt: data.updatedAt?.toDate() ?? new Date(),
              permissions: data.permissions ?? {},
            };
            setUserProfile(profile);
            setPermissions(profile.status === 'active' ? profile.permissions : {});
          } else {
            setUserProfile(null);
            setPermissions(null);
          }
        } catch {
          setUserProfile(null);
          setPermissions(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setUserProfile(null);
        setPermissions(null);
        setProfileLoading(false);
      }

      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  return (
    <RBACContext.Provider value={{ adminUser, userProfile, permissions, isSuperAdmin, authReady, profileLoading }}>
      {children}
    </RBACContext.Provider>
  );
}

export const useRBAC = () => useContext(RBACContext);
