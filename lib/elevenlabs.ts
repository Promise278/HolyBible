import { Audio } from "expo-av";

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || "";
const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Lily - Velvet British female voice

let soundObject: Audio.Sound | null = null;

export async function speakWithElevenLabs(text: string): Promise<void> {
  if (!ELEVENLABS_API_KEY) {
    console.warn("ElevenLabs API key is missing");
    return;
  }

  try {
    // Stop any existing sound
    await stopSpeech();

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const blob = await response.blob();
    // In React Native, we can't play blobs directly easily.
    // We'll use a data URI or a temporary file.
    // For simplicity and speed in this demo-like environment, we'll convert to Base64.
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: base64data },
            { shouldPlay: true },
          );
          soundObject = sound;
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
              soundObject = null;
            }
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
    });
  } catch (error) {
    console.error("ElevenLabs Error:", error);
  }
}

export async function stopSpeech(): Promise<void> {
  if (soundObject) {
    try {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null;
    } catch (e) {
      console.warn("Error stopping sound:", e);
    }
  }
}
