import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
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
  refreshProfile: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType>({
  adminUser: null,
  userProfile: null,
  permissions: null,
  isSuperAdmin: false,
  authReady: false,
  profileLoading: false,
  refreshProfile: async () => {},
});

export function RBACProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AdminUserProfile | null>(null);
  const [permissions, setPermissions] = useState<Partial<UserPermissions> | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const userRef = useRef<User | null>(null);
  const isSuperAdmin = adminUser?.email === SUPER_ADMIN_EMAIL;

  const loadProfile = async (user: User) => {
    setProfileLoading(true);
    try {
      const q = query(collection(db, 'adminUsers'), where('email', '==', user.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        const profile: AdminUserProfile = {
          id: docSnap.id,
          email: data.email ?? user.email ?? '',
          displayName: data.displayName ?? '',
          avatarUrl: data.avatarUrl ?? '',
          status: data.status ?? 'active',
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          permissions: data.permissions ?? {},
        };
        setUserProfile(profile);
        if (user.email !== SUPER_ADMIN_EMAIL) {
          setPermissions(profile.status === 'active' ? profile.permissions : {});
        }
      } else {
        setUserProfile(null);
        if (user.email !== SUPER_ADMIN_EMAIL) setPermissions(null);
      }
    } catch {
      setUserProfile(null);
      if (user.email !== SUPER_ADMIN_EMAIL) setPermissions(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (userRef.current) await loadProfile(userRef.current);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      userRef.current = user;
      setAdminUser(user);

      if (user) {
        await loadProfile(user);
      } else {
        setUserProfile(null);
        setPermissions(null);
        setProfileLoading(false);
      }

      setAuthReady(true);
    });

    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <RBACContext.Provider value={{
      adminUser, userProfile, permissions, isSuperAdmin,
      authReady, profileLoading, refreshProfile,
    }}>
      {children}
    </RBACContext.Provider>
  );
}

export const useRBAC = () => useContext(RBACContext);
