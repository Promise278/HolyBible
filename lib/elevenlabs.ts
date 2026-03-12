import * as Speech from "expo-speech";

let selectedVoice: string | undefined;
let isStopped = false;

export async function loadPreferredVoice() {
  try {
    const voices = await Speech.getAvailableVoicesAsync();

    const preferredKeywords = [
      "daniel",
      "male",
      "enhanced",
      "premium",
      "natural",
      "alex",
      "fred",
    ];

    const englishVoices = voices.filter(
      (voice) =>
        voice.language?.toLowerCase().startsWith("en") && !!voice.identifier
    );

    const best =
      englishVoices.find((voice) => {
        const name =
          `${voice.name ?? ""} ${voice.identifier ?? ""}`.toLowerCase();
        return preferredKeywords.some((keyword) => name.includes(keyword));
      }) || englishVoices[0];

    selectedVoice = best?.identifier;
    return best;
  } catch (error) {
    console.log("Could not load voices:", error);
    selectedVoice = undefined;
    return undefined;
  }
}

function splitTextIntoChunks(text: string, maxLength = 3500): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > maxLength) {
    let slice = remaining.slice(0, maxLength);
    const lastPeriod = slice.lastIndexOf(".");
    const lastSpace = slice.lastIndexOf(" ");

    let cutIndex = lastPeriod > 0 ? lastPeriod + 1 : lastSpace;
    if (cutIndex <= 0) cutIndex = maxLength;

    chunks.push(remaining.slice(0, cutIndex).trim());
    remaining = remaining.slice(cutIndex).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

function speakChunk(chunk: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Speech.speak(chunk, {
      language: "en-US",
      voice: selectedVoice,
      rate: 0.86,
      pitch: 0.92,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (error) => reject(error),
    });
  });
}

export async function speakText(text: string) {
  if (!text?.trim()) return;

  isStopped = false;
  Speech.stop();

  const chunks = splitTextIntoChunks(text, 3500);

  for (const chunk of chunks) {
    if (isStopped) break;
    await speakChunk(chunk);
  }
}

export function stopVoice() {
  isStopped = true;
  Speech.stop();
}