import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config";
import { getUserTokenProfile, UserTokenProfile } from "../redis/tokenUsage";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  provider: "google" | "demo" | "guest";
  plan: string;
}

export interface AuthSessionResponse {
  token: string;
  user: AuthUser;
  tokens: UserTokenProfile;
}

export class AuthService {
  /**
   * Issue signed JWT for an authenticated user
   */
  static generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        plan: user.plan,
        provider: user.provider,
      },
      config.jwtSecret,
      { expiresIn: "7d" }
    );
  }

  /**
   * Verify JWT session token
   */
  static verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
      return decoded;
    } catch {
      return null;
    }
  }

  static isGoogleConfigured(): boolean {
    const id = config.googleClientId;
    return Boolean(id && id !== "your_google_client_id_here" && id !== "your_google_client_id");
  }

  /**
   * Verify Google OAuth ID Token from Google Identity Services
   */
  static async verifyGoogleCredential(credential: string): Promise<AuthSessionResponse> {
    const idToken = credential.trim();
    if (!idToken) {
      throw new Error("Missing Google credential");
    }

    if (!this.isGoogleConfigured()) {
      throw new Error(
        "Google Sign-In is not configured. Set GOOGLE_CLIENT_ID (and NEXT_PUBLIC_GOOGLE_CLIENT_ID) to your OAuth client ID."
      );
    }

    // Decode without verifying first so we can give a helpful mismatch error
    // instead of the opaque "Wrong recipient, payload audience != requiredAudience"
    const [, payloadB64] = idToken.split(".");
    if (payloadB64) {
      try {
        const raw = Buffer.from(payloadB64, "base64url").toString("utf8");
        const { aud } = JSON.parse(raw) as { aud?: string | string[] };
        const audiences = Array.isArray(aud) ? aud : [aud];
        if (!audiences.includes(config.googleClientId)) {
          console.error(
            `[Auth] Google Client ID mismatch.\n` +
            `  Token audience : ${audiences.join(", ")}\n` +
            `  Server expects : ${config.googleClientId}\n` +
            `  Fix: ensure GOOGLE_CLIENT_ID on the server matches NEXT_PUBLIC_GOOGLE_CLIENT_ID used by the frontend.`
          );
          throw new Error(
            `Google Client ID mismatch: the token was issued for "${audiences[0]}" but the server is configured with a different Client ID. ` +
            `Make sure GOOGLE_CLIENT_ID in your server environment matches the NEXT_PUBLIC_GOOGLE_CLIENT_ID used to build the frontend.`
          );
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.includes("mismatch")) throw parseErr;
        // If we can't decode the JWT header, fall through and let google-auth-library handle it
      }
    }

    const googleClient = new OAuth2Client(config.googleClientId);
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new Error("Invalid Google token payload: email is missing.");
    }

    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const picture = payload.picture || "";
    const sub = payload.sub;

    const userId = `usr_${sub.slice(-12)}`;
    const user: AuthUser = {
      id: userId,
      email,
      name,
      picture: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      provider: "google",
      plan: "free",
    };

    const token = this.generateToken(user);
    const tokens = await getUserTokenProfile(userId, "free");

    return { token, user, tokens };
  }

  /**
   * Fast 1-Click Demo Google Login (for instant testing without setup)
   */
  static async demoLogin(customEmail?: string, customName?: string): Promise<AuthSessionResponse> {
    const email = customEmail || "demo.builder@kivo.ai";
    const name = customName || "Demo Builder";
    const userId = "usr_demo_kivo_builder";

    const user: AuthUser = {
      id: userId,
      email,
      name,
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      provider: "demo",
      plan: "free",
    };

    const token = this.generateToken(user);
    const tokens = await getUserTokenProfile(userId, "free");

    return { token, user, tokens };
  }

  /**
   * Get user profile and live tokens
   */
  static async getProfile(userId: string, authUser?: AuthUser): Promise<{ user: AuthUser; tokens: UserTokenProfile }> {
    const tokens = await getUserTokenProfile(userId);
    const user: AuthUser = authUser || {
      id: userId,
      email: "user@kivo.ai",
      name: "Kivo User",
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userId)}`,
      provider: "guest",
      plan: tokens.plan,
    };
    user.plan = tokens.plan;

    return { user, tokens };
  }
}
