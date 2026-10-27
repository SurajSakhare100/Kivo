"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  monthlyTokens: number;
  rateLimitPerMin: number;
  badge?: string;
  description: string;
  features: string[];
}

export interface UserTokenProfile {
  userId: string;
  plan: string;
  planDetails: PricingPlan;
  tokenLimit: number;
  tokensUsed: number;
  tokensRemaining: number;
  percentUsed: number;
  isCustomLimit: boolean;
  cycleStart: string;
  lastUpdated: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  provider: "google" | "demo" | "guest";
  plan: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  tokens: UserTokenProfile | null;
  pricingPlans: PricingPlan[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  isTokenSettingsOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openTokenSettings: () => void;
  closeTokenSettings: () => void;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginDemo: (email?: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  updateTokensLive: (data: Partial<UserTokenProfile>) => void;
  updateDummySettings: (params: {
    plan?: string;
    customLimit?: number;
    resetUsage?: boolean;
    simulateExhaustion?: boolean;
    refillAmount?: number;
  }) => Promise<boolean>;
  refillTokens: (amount?: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokens, setTokens] = useState<UserTokenProfile | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isTokenSettingsOpen, setIsTokenSettingsOpen] = useState<boolean>(false);

  // 1. Initial Load: Check saved token and fetch pricing
  useEffect(() => {
    async function initAuth() {
      try {
        // Load Pricing Plans
        fetch(`${API_BASE}/api/tokens/pricing`)
          .then((res) => res.json())
          .then((data) => {
            if (data.plans) setPricingPlans(data.plans);
          })
          .catch(() => {});

        const savedToken = localStorage.getItem("kivo_token");
        if (savedToken) {
          setToken(savedToken);
          // Fetch user profile and balance
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setTokens(data.tokens);
          } else {
            // Token expired or invalid
            localStorage.removeItem("kivo_token");
            setToken(null);
            setUser(null);
            await fetchGuestBalance();
          }
        } else {
          await fetchGuestBalance();
        }
      } catch (err) {
        console.warn("[Auth] Failed to initialize session:", err);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchGuestBalance() {
      try {
        const res = await fetch(`${API_BASE}/api/tokens/balance`);
        if (res.ok) {
          const balance = await res.json();
          setTokens(balance);
        }
      } catch {}
    }

    initAuth();
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/tokens/balance`, { headers });
      if (res.ok) {
        const balance = await res.json();
        setTokens(balance);
      }
    } catch (err) {
      console.warn("Failed to refresh token balance", err);
    }
  }, [token]);

  const updateTokensLive = useCallback((data: Partial<UserTokenProfile>) => {
    setTokens((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      if (updated.tokenLimit && updated.tokensUsed !== undefined) {
        updated.tokensRemaining = Math.max(0, updated.tokenLimit - updated.tokensUsed);
        updated.percentUsed = Math.min(100, Math.round((updated.tokensUsed / updated.tokenLimit) * 100));
      }
      return updated;
    });
  }, []);

  const loginWithGoogle = useCallback(async (credential: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      if (!res.ok) throw new Error("Google login failed");

      const data = await res.json();
      localStorage.setItem("kivo_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setTokens(data.tokens);
      setIsLoginModalOpen(false);
      return true;
    } catch (err) {
      console.error("[Auth] Login with Google error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginDemo = useCallback(async (email?: string, name?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!res.ok) throw new Error("Demo login failed");

      const data = await res.json();
      localStorage.setItem("kivo_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setTokens(data.tokens);
      setIsLoginModalOpen(false);
      return true;
    } catch (err) {
      console.error("[Auth] Demo login error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem("kivo_token");
      setToken(null);
      setUser(null);
      refreshBalance();
    }
  }, [token, refreshBalance]);

  const updateDummySettings = useCallback(
    async (params: {
      plan?: string;
      customLimit?: number;
      resetUsage?: boolean;
      simulateExhaustion?: boolean;
      refillAmount?: number;
    }): Promise<boolean> => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/api/tokens/dummy-settings`, {
          method: "POST",
          headers,
          body: JSON.stringify(params),
        });

        if (!res.ok) throw new Error("Failed to update dummy settings");

        const data = await res.json();
        if (data.profile) {
          setTokens(data.profile);
          if (user && params.plan) {
            setUser((prev) => (prev ? { ...prev, plan: params.plan! } : null));
          }
        }
        return true;
      } catch (err) {
        console.error("Failed to update dummy settings:", err);
        return false;
      }
    },
    [token, user]
  );

  const refillTokens = useCallback(
    async (amount = 50000): Promise<boolean> => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/api/tokens/refill`, {
          method: "POST",
          headers,
          body: JSON.stringify({ amount }),
        });

        if (!res.ok) throw new Error("Failed to refill tokens");

        const data = await res.json();
        if (data.profile) {
          setTokens(data.profile);
        }
        return true;
      } catch (err) {
        console.error("Failed to refill tokens:", err);
        return false;
      }
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tokens,
        pricingPlans,
        isAuthenticated: !!user && user.provider !== "guest",
        isLoading,
        isLoginModalOpen,
        isTokenSettingsOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        openTokenSettings: () => setIsTokenSettingsOpen(true),
        closeTokenSettings: () => setIsTokenSettingsOpen(false),
        loginWithGoogle,
        loginDemo,
        logout,
        refreshBalance,
        updateTokensLive,
        updateDummySettings,
        refillTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
