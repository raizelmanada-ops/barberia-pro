import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserRole, User, UserSession, Permission } from '../types';
import { AuthService } from '../services/authService';
import { useTenant } from '../tenant/TenantContext';

interface AuthContextType {
  currentUser: User;
  currentRole: UserRole;
  currentSession: UserSession | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  setRole: (role: UserRole) => void;
  loginAsClient: (phone: string, name: string) => UserSession;
  loginAsStaff: (role: UserRole) => UserSession;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  validateAccessToTenant: (targetBusinessId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentBusiness } = useTenant();

  const [session, setSession] = useState<UserSession | null>(() => {
    const existing = AuthService.getCurrentSession();
    if (existing) return existing;
    // Default initial session for public guest client arriving via QR
    return {
      token: 'tok_guest',
      activeBusinessId: currentBusiness.id,
      activeRole: 'client',
      user: {
        id: 'guest',
        businessId: currentBusiness.id,
        role: 'client',
        roles: ['client'],
        fullName: 'Cliente Invitado',
        phone: '',
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync session tenant when business changes
  useEffect(() => {
    if (session && session.activeRole !== 'superadmin' && session.activeBusinessId !== currentBusiness.id) {
      // Re-initialize session for new active business
      const newSession = AuthService.loginStaff(currentBusiness.id, session.activeRole);
      setSession(newSession);
    }
  }, [currentBusiness.id]);

  const loginAsClient = useCallback((phone: string, name: string): UserSession => {
    const newSession = AuthService.loginClient(currentBusiness.id, name, phone);
    setSession(newSession);
    setIsAuthModalOpen(false);
    return newSession;
  }, [currentBusiness.id]);

  const loginAsStaff = useCallback((role: UserRole): UserSession => {
    const newSession = AuthService.loginStaff(currentBusiness.id, role);
    setSession(newSession);
    return newSession;
  }, [currentBusiness.id]);

  const setRole = useCallback((role: UserRole) => {
    if (role === 'client') {
      loginAsClient('+57 310 555 1234', currentBusiness.id === 'biz_arizshop_01' ? 'Pedro Duarte' : 'Juan Pérez');
    } else {
      loginAsStaff(role);
    }
  }, [currentBusiness.id, loginAsClient, loginAsStaff]);

  const logout = useCallback(() => {
    AuthService.logout();
    // Default back to guest client
    const guestSession = AuthService.loginClient(currentBusiness.id, 'Cliente Invitado', '');
    setSession(guestSession);
  }, [currentBusiness.id]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return AuthService.hasRole(role);
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return AuthService.hasPermission(permission);
  }, []);

  const validateAccessToTenant = useCallback((targetBusinessId: string): boolean => {
    return AuthService.validateTenantAccess(targetBusinessId);
  }, []);

  const currentUser = session ? session.user : {
    id: 'guest',
    businessId: currentBusiness.id,
    role: 'client' as UserRole,
    roles: ['client' as UserRole],
    fullName: 'Cliente Invitado',
    phone: '',
    createdAt: new Date().toISOString(),
  };

  const currentRole = session ? session.activeRole : 'client';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        currentSession: session,
        isAuthenticated: session !== null && session.user.id !== 'guest',
        isAuthModalOpen,
        setIsAuthModalOpen,
        setRole,
        loginAsClient,
        loginAsStaff,
        logout,
        hasRole,
        hasPermission,
        validateAccessToTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
