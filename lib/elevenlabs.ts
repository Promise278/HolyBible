// import * as Speech from "expo-speech";

// let selectedVoice: string | undefined;
// let isStopped = false;

// export async function loadPreferredVoice() {
//   try {
//     const voices = await Speech.getAvailableVoicesAsync();

//     const preferredMaleKeywords = [
//       "daniel",
//       "male",
//       "alex",
//       "fred",
//       "david",
//       "thomas",
//       "premium",
//       "enhanced",
//     ];

//     const englishVoices = voices.filter(
//       (voice) =>
//         voice.language?.toLowerCase().startsWith("en") && !!voice.identifier,
//     );

//     const bestMale =
//       englishVoices.find((voice) => {
//         const name =
//           `${voice.name ?? ""} ${voice.identifier ?? ""}`.toLowerCase();
//         return preferredMaleKeywords.some((keyword) => name.includes(keyword));
//       }) ||
//       englishVoices.find((v) => v.name?.toLowerCase().includes("male")) ||
//       englishVoices[0];

//     selectedVoice = bestMale?.identifier;
//     return bestMale;
//   } catch (error) {
//     console.log("Could not load voices:", error);
//     selectedVoice = undefined;
//     return undefined;
//   }
// }

// function splitTextIntoChunks(text: string, maxLength = 3500): string[] {
//   const chunks: string[] = [];
//   let remaining = text.trim();

//   while (remaining.length > maxLength) {
//     let slice = remaining.slice(0, maxLength);
//     const lastPeriod = slice.lastIndexOf(".");
//     const lastSpace = slice.lastIndexOf(" ");

//     let cutIndex = lastPeriod > 0 ? lastPeriod + 1 : lastSpace;
//     if (cutIndex <= 0) cutIndex = maxLength;

//     chunks.push(remaining.slice(0, cutIndex).trim());
//     remaining = remaining.slice(cutIndex).trim();
//   }

//   if (remaining.length > 0) {
//     chunks.push(remaining);
//   }

//   return chunks;
// }

// function speakChunk(chunk: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     Speech.speak(chunk, {
//       language: "en-US",
//       voice: selectedVoice,
//       rate: 0.75,
//       pitch: 0.85,
//       onDone: () => resolve(),
//       onStopped: () => resolve(),
//       onError: (error) => reject(error),
//     });
//   });
// }

// export async function speakText(
//   text: string,
//   p0: { voice: string; model: string; stability: number; clarity: number },
// ) {
//   if (!text?.trim()) return;

//   isStopped = false;
//   Speech.stop();

//   const chunks = splitTextIntoChunks(text, 3500);

//   for (const chunk of chunks) {
//     if (isStopped) break;
//     await speakChunk(chunk);
//   }
// }

// export function stopVoice() {
//   isStopped = true;
//   Speech.stop();
// }
import * as Speech from "expo-speech";

let selectedVoice: string | undefined;
let isStopped = false;

export async function loadPreferredVoice() {
  try {
    const voices = await Speech.getAvailableVoicesAsync();

    const preferredMaleKeywords = [
      "daniel",
      "male",
      "alex",
      "fred",
      "david",
      "thomas",
      "premium",
      "enhanced",
    ];

    const englishVoices = voices.filter(
      (voice) =>
        voice.language?.toLowerCase().startsWith("en") && !!voice.identifier,
    );

    const bestMale =
      englishVoices.find((voice) => {
        const name =
          `${voice.name ?? ""} ${voice.identifier ?? ""}`.toLowerCase();
        return preferredMaleKeywords.some((keyword) => name.includes(keyword));
      }) || englishVoices[0];

    selectedVoice = bestMale?.identifier;
    console.log("Selected voice:", bestMale?.name, bestMale?.identifier);
    return bestMale;
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
    const slice = remaining.slice(0, maxLength);
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
      rate: 0.75,
      pitch: 0.85,
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