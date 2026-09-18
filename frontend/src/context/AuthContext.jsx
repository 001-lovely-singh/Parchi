import React, { createContext, useState, useEffect, useContext } from 'react';
import { Preferences } from '@capacitor/preferences';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { value: storedToken } = await Preferences.get({ key: 'token' });
      const { value: storedUser } = await Preferences.get({ key: 'user' });
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    await Preferences.set({ key: 'token', value: authToken });
    await Preferences.set({ key: 'user', value: JSON.stringify(userData) });
  };

  const login = persist;
  const signup = persist;

  const logout = async () => {
    setUser(null);
    setToken(null);
    await Preferences.remove({ key: 'token' });
    await Preferences.remove({ key: 'user' });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
