import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  emoji: string;
  total: number;
  done: number;
  lastRead?: number; // timestamp
}

const STORAGE_KEY = "HOLY_BIBLE_PLANS";

const DEFAULT_PLANS: ReadingPlan[] = [
  {
    id: "psalms-21",
    title: "21 Days with Psalms",
    description: "Explore worship, lament, and praise through the Psalms.",
    emoji: "🎶",
    total: 21,
    done: 0,
  },
  {
    id: "nt-journey",
    title: "New Testament Journey",
    description: "Walk through the life, death, and resurrection of Jesus.",
    emoji: "✝️",
    total: 100,
    done: 0,
  },
  {
    id: "proverbs-30",
    title: "30 Days of Proverbs",
    description: "One chapter of Proverbs each day for a month.",
    emoji: "📖",
    total: 30,
    done: 0,
  },
  {
    id: "genesis",
    title: "In the Beginning",
    description: "A deep dive into Genesis — the foundation of everything.",
    emoji: "🌍",
    total: 50,
    done: 0,
  },
];

export async function getReadingPlans(): Promise<ReadingPlan[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with defaults if empty
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PLANS));
      return DEFAULT_PLANS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PLANS;
  }
}

export async function updatePlanProgress(
  id: string,
  increment: number = 1,
): Promise<ReadingPlan[]> {
  const all = await getReadingPlans();
  const updated = all.map((plan) => {
    if (plan.id === id) {
      const newDone = Math.min(plan.total, plan.done + increment);
      return { ...plan, done: newDone, lastRead: Date.now() };
    }
    return plan;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function resetPlan(id: string): Promise<ReadingPlan[]> {
  const all = await getReadingPlans();
  const updated = all.map((plan) => {
    if (plan.id === id) {
      return { ...plan, done: 0, lastRead: undefined };
    }
    return plan;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
