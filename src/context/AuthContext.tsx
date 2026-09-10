// CVIA — Defense Operator Authentication Context
// SIH26228 · Ministry of Defence / DGIS
// Manages authenticated operator identity and multi-user isolation across components.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ServerUser } from '../server/types';
import {
  getCurrentUserApi,
  loginOperatorApi,
  registerOperatorApi,
  getPresetOperatorsApi,
  logoutOperatorApi
} from '../lib/api/authApi';
import { getStoredToken } from '../lib/api/client';

interface AuthContextType {
  user: ServerUser | null;
  isLoading: boolean;
  availableOperators: ServerUser[];
  login: (email: string, password?: string) => Promise<boolean>;
  register: (email: string, fullName: string, organization: string, unitCode: string) => Promise<boolean>;
  switchOperator: (email: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ServerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableOperators, setAvailableOperators] = useState<ServerUser[]>([]);

  // Load presets and current session
  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const presets = await getPresetOperatorsApi();
      setAvailableOperators(presets);

      const token = getStoredToken();
      if (token) {
        const current = await getCurrentUserApi();
        if (current) {
          setUser(current);
          setIsLoading(false);
          return;
        }
      }

      // Default baseline: Auto-login as Unit Alpha Commander for seamless initial state
      const defaultOp = await loginOperatorApi('commander.alpha@dgis.gov.in');
      setUser(defaultOp);
    } catch (err) {
      console.error('[CVIA Auth] Error initializing operator session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const op = await loginOperatorApi(email, password);
      if (op) {
        setUser(op);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    fullName: string,
    organization: string,
    unitCode: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const op = await registerOperatorApi(email, fullName, organization, unitCode);
      if (op) {
        setUser(op);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const switchOperator = async (email: string): Promise<boolean> => {
    return login(email);
  };

  const logout = () => {
    logoutOperatorApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        availableOperators,
        login,
        register,
        switchOperator,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
