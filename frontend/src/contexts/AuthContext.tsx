import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType } from '@/types';
import { AuthService } from '@/services/api/authService';
import { AuthContext } from './AuthContextDef';

interface AuthProviderProps {
  children: ReactNode;
}

const authService = new AuthService();

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にセッションからユーザー情報を復元
  useEffect(() => {
    const initAuth = async () => {
      try {
        // NextAuth.jsセッションをチェック
        const hasSession = await authService.checkSession();

        if (hasSession) {
          // セッションが有効な場合、ユーザー情報を取得
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('認証初期化エラー:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.signup({ email, password });
      setUser(response.user);
    } catch (error) {
      console.error('サインアップエラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
