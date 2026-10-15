# 🔒 Stealth Couple Chat App

A discreet, private real-time communication web app for you and your partner, disguised as an authentic **ChatGPT** interface.

When anyone looks at your screen, it looks and behaves 100% like ChatGPT (with realistic AI responses, history sidebar, and model picker). But tapping the **"Voice"** button (or secret trigger) instantly opens your private **Snapchat-style** couple lounge with live texting, audio voicemails with dynamic waveforms, in-app video & photo snaps, "Save in Chat", and couple streaks!

---

## ✨ Features Overview

### 1. 🎭 The Stealth ChatGPT Camouflage
- **Pixel-Perfect ChatGPT Clone**: Complete with dark/light themes, model selector ("ChatGPT 4o"), sidebar with mock chat history, and greeting chips.
- **Interactive AI Decoy**: Types realistic AI answers if anyone borrows your phone/laptop to test it.
- **The Secret Door**: Clicking the prominent **"Voice"** button (or triple-clicking the logo) reveals the private chat entrance.
- **Optional 4-Digit Voice PIN**: Disguised as *"Voice Mode Security (Error 401)"* for extra peace of mind.
- **🚨 Instant Panic Switch**:
  - Tap the **Stealth Shield** button in the top right.
  - Or double-tap the **`Escape`** key anywhere.
  - Instantly drops back to ChatGPT screen in 0 milliseconds!

---

### 2. 👻 The Snapchat-Style Couple Lounge
- **Real-Time Texting**: Instant messaging with auto-scroll and delivery timestamps.
- **🎙️ Voice Memos**:
  - Direct microphone recorder with live animated frequency waveform.
  - Snapchat-style voice pill with dynamic audio progress, scrubbing, and speed multiplier (1x / 1.5x / 2x).
  - Codec fallbacks (`audio/webm`, `audio/mp4`, `audio/wav`) optimized for iOS Safari & Android.
- **📸 In-App Snap Camera & Video Recorder**:
  - Built-in camera with front/back selfie flip.
  - Tap shutter for instant photo snap; press & hold for up to 30-second video snap with circular recording ring.
  - Fallback button to upload photos or videos directly from camera roll.
- **📱 Full-Screen Snap Viewer**:
  - Tap to view video and photo snaps in full-screen story mode.
  - **Press and hold to pause** (just like Snapchat!).
- **📌 Save in Chat**:
  - Click or long-press any text or media message to toggle "Save in Chat".
  - Displays the iconic thick vertical yellow border on the left and stays pinned.
- **🔥 Couple Streaks**:
  - Live streak counter (e.g. `🔥 42 Days`).
  - Tap the streak pill to trigger dual-burst heart & firework confetti!
- **🟢 Live Presence & Typing Status**:
  - Pulsating indicator when partner is online.
  - Live animated typing indicator ("Typing...").

---

### 3. 🔗 Dedicated Links ("One for Her, One for Me")

Inside the chat, click the **Settings / Link** icon in the header to open the **Couples Hub & Pairing** modal:

| Person | Link Format | Behavior |
|---|---|---|
| **You (Him)** | `https://your-app.vercel.app/?user=partner1` | Automatically identifies you as Partner 1 (e.g. "Me" 👑) |
| **Her (Girlfriend)** | `https://your-app.vercel.app/?user=partner2` | Automatically identifies her as Partner 2 (e.g. "My Love" ✨) |

> **Pro Tip**: Send her link to her phone. When she opens it, her phone automatically remembers her identity forever in `localStorage`. Both of you can add the site to your phone's Home Screen (PWA style) with the ChatGPT icon!

---

## 🚀 One-Click Deployment to Vercel

### Step 1: Push to GitHub
1. Create a new private repository on your [GitHub account](https://github.com/new).
2. In this project directory on your terminal:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Import to Vercel
1. Go to [Vercel](https://vercel.com/new) and click **"Import Project"**.
2. Select your newly created GitHub repository.
3. Keep the default settings (Framework: Next.js) and click **Deploy**.
4. That's it! Vercel will give you a live production link like `https://your-stealth-app.vercel.app`.

---

## 💾 Persistence Options

The application is built with a zero-config hybrid storage layer:

1. **Default Zero-Config Mode**:
   - Works immediately out of the box locally and on Vercel without requiring any external database.
   - Client-side storage replicates messages so conversations and media persist across visits.

2. **Optional Supabase Cloud Database**:
   - If you want persistent cloud storage across multiple serverless regions, create a free project at [Supabase](https://supabase.com).
   - Run the included [`supabase_schema.sql`](./supabase_schema.sql) in the Supabase SQL editor.
   - Add these environment variables in your Vercel Project Settings:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     ```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build check
npm run build

# Run linter
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view your stealth ChatGPT interface. Click **"Voice"** on the prompt bar to enter your private lounge!
