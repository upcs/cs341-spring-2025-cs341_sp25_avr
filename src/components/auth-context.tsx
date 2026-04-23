import { createContext, useContext } from "react";

export interface AuthContextValue {
  authenticated: boolean;
  readOnly: boolean;
  displayName: string;
  userKey: string;
  role?: "member" | "admin";
  isAdmin?: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  authenticated: false,
  readOnly: true,
  displayName: "",
  userKey: "guest:anonymous",
  role: "member",
  isAdmin: false,
});

export const AuthProvider = AuthContext.Provider;

export function useAuth() {
  return useContext(AuthContext);
}
