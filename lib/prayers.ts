export interface Prayer {
  id: string;
  title: string;
  category: string;
  content: string;
  duration: string;
}

export const DAILY_PRAYERS: Prayer[] = [
  {
    id: "1",
    title: "Morning Gratitude",
    category: "Gratitude",
    content:
      "Lord, thank You for this new day. I thank You for the breath in my lungs and the life You have given me. Help me to serve You today with a joyful heart.",
    duration: "2 min",
  },
  {
    id: "2",
    title: "Strength for Challenges",
    category: "Strength",
    content:
      "Father, I ask for Your strength to face the obstacles before me. Grant me wisdom to make the right decisions and peace in the midst of any storm.",
    duration: "3 min",
  },
  {
    id: "3",
    title: "Peace in the Heart",
    category: "Peace",
    content:
      "Prince of Peace, I surrender my anxieties and worries to You. Fill my mind with Your peace that surpasses all understanding.",
    duration: "2 min",
  },
  {
    id: "4",
    title: "A Heart of Service",
    category: "Mission",
    content:
      "Lord, show me someone today who needs Your love. Help me to be Your hands and feet to those I encounter.",
    duration: "2 min",
  },
];

export async function getDailyPrayers(): Promise<Prayer[]> {
  // In a real app, this could fetch from a server based on the date.
  return DAILY_PRAYERS;
}
