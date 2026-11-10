import { createContext, useContext, useEffect, useState } from 'react';
import { api, session, setLogoutHandler } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => session.get()?.user || null);

  useEffect(() => {
    setLogoutHandler(() => setUser(null));
    if (session.get()) api('/auth/me').then(setUser).catch(() => {});
  }, []);

  const login = async (mobile, pin) => {
    const s = await api('/auth/login', { method: 'POST', body: { mobile, pin } });
    session.set(s);
    setUser(s.user);
    return s.user;
  };
  const logout = () => { session.clear(); setUser(null); };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
