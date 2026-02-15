import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./prisma";
import { env } from "./env";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: env.BETTER_AUTH_SECRET,

  // ============================================
  // REQUIRED: All trustedOrigins below are needed
  // ============================================
  trustedOrigins: [
    "vibecode://*/*",           // Mobile deep links - REQUIRED
    "exp://*/*",                // Expo development - REQUIRED
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.dev.vibecode.run",
    "https://*.vibecode.run",
    "https://*.vibecodeapp.com",
  ],
  plugins: [
    expo(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Send OTP via Vibecode SMTP service (no auth required)
        // Only send OTPs for sign-in right now.
        if (type !== "sign-in") return;

        const response = await fetch("https://smtp.vibecodeapp.com/v1/send/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            code: String(otp),
            fromName: "OpenClaw",
            lang: "en",
          }),
        });

        if (!response.ok) {
          // Vibecode SMTP errors are returned as `{ "error": "..." }` (full docs: https://smtp.vibecodeapp.com/llms.txt)
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || `Failed to send OTP (HTTP ${response.status})`);
        }
      },
    }),
  ],

  // ============================================
  // REQUIRED: Cross-origin cookie settings
  // Without this, sessions return null in mobile/iframe
  // ============================================
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
});
