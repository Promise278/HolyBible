# Holy Bible App 📖✨

A premium, modern Bible reading experience built with React Native and Expo. Dive deep into the Word with AI-powered insights and a high-quality human-like voice reader.

![Holy Bible Console](./assets/images/holybiblesolana.png)

## ✨ Features

- **Premium Bible Reader**: Multiple translations (KJV, NIV, MSG) with a sleek, readable interface.
- **AI Breakdown & Summary**: Get deep insights, context, and summaries for any chapter or verse powered by Gemini AI.
- **Human-Like Voice Reader**: Listen to the Word with crystal-clear, natural voices provided by ElevenLabs.
- **Personalized Reading Plans**: Track your daily progress through curated journeys like "21 Days with Psalms".
- **Star & Save**: Collect your favorite verses in a dedicated workspace.
- **Elegant Design**: A serene, distraction-free environment with custom typography and smooth animations.

## 🚀 Getting Started

### Prerequisites

- [Expo Go](https://expo.dev/go) on your mobile device or an Emulator
- A [Bible API Key](https://api.bible/)
- A [Gemini API Key](https://aistudio.google.com/) (for AI features)
- An [ElevenLabs API Key](https://elevenlabs.io/) (for Voice Reader)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Promise278/HolyBible.git
   cd HolyBible
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your keys:

   ```env
   EXPO_PUBLIC_BIBLE_API_KEY=your_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_key
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_key
   ```

4. **Start the app:**
   ```bash
   npx expo start
   ```

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) / [React Native](https://reactnative.dev/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **AI/ML**: Google Gemini API
- **TTS**: ElevenLabs API
- **Persistence**: AsyncStorage