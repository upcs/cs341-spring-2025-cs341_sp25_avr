import { createContext, useContext } from "react";

export interface AuthContextValue {
  authenticated: boolean;
  readOnly: boolean;
  displayName: string;
}

const AuthContext = createContext<AuthContextValue>({
  authenticated: false,
  readOnly: true,
  displayName: "",
});

export const AuthProvider = AuthContext.Provider;

export function useAuth() {
  return useContext(AuthContext);
}
