import { Audio } from "expo-av";

const ELEVENLABS_API_KEY = (
  process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || ""
).trim();

// Thomas - Calm, professional narrator (American)
const VOICE_ID = "GBv7mTt0atIp3Br8iCZE";

let soundObject: Audio.Sound | null = null;

export async function speakWithElevenLabs(text: string): Promise<void> {
  if (!ELEVENLABS_API_KEY) {
    console.warn("ElevenLabs API key is missing");
    return;
  }

  try {
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
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API Error:", response.status, errorText);
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.detail?.code === "quota_exceeded") {
          throw new Error(
            "You have run out of ElevenLabs credits for this large request. Please try listening to individual verses instead of the whole chapter, or upgrade your plan at elevenlabs.io",
          );
        }
      } catch (e: any) {
        if (e.message.includes("ElevenLabs credits")) throw e;
      }
      throw new Error(`ElevenLabs error ${response.status}: ${errorText}`);
    }

    const blob = await response.blob();

    // In React Native, FileReader is the most reliable way to handle blobs for audio
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });

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
          console.error("Audio playback error:", e);
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("ElevenLabs Network or Playback Error:", error);
    throw error;
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
