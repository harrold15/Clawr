<!-- Banner Image -->
<p align="center">
  <img src="https://kvzwukjcvwcopmtqkiih.supabase.co/storage/v1/object/public/Clawr/1500x500%20(14).jpg" alt="Clawr App Banner" width="100%">
</p>

# Clawr
The first iOS app for OpenClaw — create, import, and manage AI agents directly from your mobile device.

---

## App Structure

### Auth (public routes)
- **Sign In** (`/sign-in`) — Apple, Google sign-in with skip option. Brand: Pear logo

### Protected Routes (inside `(app)/`)
- **Onboarding** — Choose: Create Cloud Agent (with cloud icon) or Connect Local Agent (with computer icon)
- **Create Agent** — Loading state (2 seconds, "Creating your agent"), success screen with random avatar, name your agent, navigate to home
- **Connect Agent** — Two connection methods:
  - **Cloud Agent** — Simple cloud setup flow
  - **Local Computer** — QR code scanning + manual pairing code. Shows instructions to run `npm install -g clawr-bridge && clawr-bridge pair` on desktop. User scans generated QR code or enters 6-character pairing code manually. Features 30-second timeout, error handling, and real-time status display

### Main Tabs (`(app)/(tabs)/`)
- **Home** — Agent hero card with avatar, quick actions, pending approvals, recent activity
- **Chat** — Chat interface with agent, suggestions, image upload, voice input
- **Feed** — Live agent activity feed showing completed work across all agents
- **Tasks** — All tasks with status filtering
- **Notifications** — Beautiful approval, completion, and info notifications with agent avatars, color-coded by type, blur glass effects
- **Settings** — Agent config, integrations, wallet, permissions, account

### Stack Screens (inside `(app)/`)
- **Approval** — Features welcome banner ("New to Clawr? Learn how it works in 2 mins") with background image and lobster illustration, shows agent avatar, approve/deny actions with "Book flight on Delta.com" example
- **Task Composer** — Create new tasks with prompt and mode
- **Task Detail** — Live progress view for running tasks
- **Agent Settings** — Edit agent name, persona, goals, schedule, view/manage avatar
- **Permissions** — Toggle capabilities and approval policies
- **Account** — Profile, billing, usage meters, help
- **Integrations** — Connect services: Gmail, Slack, Discord, Twitter, Instagram, Notion, GitHub, Linear, Zapier, Make, Stripe, HubSpot
- **Wallet** — Create blockchain wallets for Ethereum or Solana, view balances, send/receive, transaction history

## Tech Stack
- **Frontend:** Expo SDK 53, React Native, Expo Router, NativeWind (Tailwind), Zustand, React Query, Reanimated
- **Backend:** Bun, Hono, Prisma (SQLite), Better Auth
- **Design:** Dark theme (#000000) background, white accent (#FFFFFF) brand color, dark surface cards (#0A0A0A)
- **Avatars:** 14 random profile pictures assigned to agents on creation, persisted with agent data

## Design System
- **Background:** #000000 (black) — dark, modern aesthetic
- **Surfaces:** #0A0A0A cards on #000000 background
- **Accent:** #FFFFFF (white) — brand color for buttons, active states, highlights
- **Text hierarchy:** #FFFFFF / #A1A1AA / #71717A (3 levels)
- **Borders:** #27272A
- **Semantic:** Success #51CF66, Warning #FFA500, Danger #FF6B6B, Info #4A9EFF
- **Corner radii:** 20px cards (blur glass), 16px surfaces, 14px buttons, 12px chips
- **Spacing:** 8pt grid system
- **Effects:** Blur glass (expo-blur) on notification cards, colored tinted backgrounds for notification types

## Agent Avatars
- **Count:** 13 unique avatar images (stored in `/mobile/assets/avatars/`)
- **Assignment:** Randomly selected when an agent is created
- **Persistence:** Stored as `avatarId` (1-13) with agent data in Zustand store
- **Display:** Shown on:
  - Dashboard hero card
  - Settings agent section
  - Agent Settings screen
  - Approval requests
  - Throughout the app for quick visual identification

## Auth
- Apple / Google sign-in via Better Auth
- Skip option that bypasses auth (sets isAuthenticated in store, navigates to onboarding)
- Stack.Protected guards for automatic route protection
- Session managed via React Query

## Key Files
- `mobile/src/lib/types.ts` — All TypeScript types (Agent with avatarId, Task, Approval, etc.)
- `mobile/src/lib/store.ts` — Zustand store with mock data and avatar assignment
- `mobile/src/lib/theme.ts` — Design tokens (colors, gradients, spacing)
- `mobile/src/lib/avatars.ts` — Avatar utilities (getRandomAvatarId, getAvatarImage)
- `mobile/src/lib/auth/auth-client.ts` — Better Auth client
- `mobile/src/lib/auth/use-session.ts` — Session hook (React Query)
- `mobile/src/app/(app)/connect-agent.tsx` — Local computer connection with QR + manual code entry
- `mobile/src/components/QRScannerModal.tsx` — Camera-based QR code scanner with torch control
- `backend/src/routes/agents.ts` — Agent pairing endpoints: `/api/agents/pair/init`, `/api/agents/pair`, `/api/agents/pair/status/:sessionId`
- `backend/src/auth.ts` — Better Auth server config
- `backend/prisma/schema.prisma` — Database schema with PairingSession model


## License

Distributed under the MIT License. See the LICENSE file for more information.
