import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredSession,
  loginWithCredentials,
  switchRole as clientSwitchRole,
  loginWithDemo,
  logout as clientLogout,
  canUseDemoAuth,
  isRealAuthConfigured,
} from './authClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredSession());
  const [isLoading, setIsLoading] = useState(false);

  const demoAuthAvailable = canUseDemoAuth();
  const realConfigured = isRealAuthConfigured();

  const handleCredentialsLogin = (creds) => {
    setIsLoading(true);
    try {
      const session = loginWithCredentials(creds);
      setUser(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchRole = (newRole) => {
    const updated = clientSwitchRole(newRole);
    if (updated) {
      setUser(updated);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    try {
      const session = loginWithDemo();
      setUser(session);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clientLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'citizen',
        isAuthenticated: Boolean(user),
        isDemoAuth: Boolean(user?.isDemo),
        canUseDemoAuth: demoAuthAvailable,
        isRealAuthConfigured: realConfigured,
        loginWithCredentials: handleCredentialsLogin,
        switchRole: handleSwitchRole,
        loginWithDemo: handleDemoLogin,
        logout: handleLogout,
        isLoading,
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
