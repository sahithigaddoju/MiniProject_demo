import { createContext, useContext, useState } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Read localStorage once synchronously — no async, no double render
  const [user, setUser] = useState(() => {
    try {
      const token    = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      if (token && userData) return userData;
      return null;
    } catch {
      return null;
    }
  });

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    console.log('[Auth] Logged in:', userData.name);
  };

  const logout = (reason = 'manual') => {
    console.log('[Auth] Logged out — reason:', reason);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
