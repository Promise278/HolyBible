import AsyncStorage from '@react-native-async-storage/async-storage';

export type FavoriteVerse = {
  id: string; 
  book: string;
  chapter: string;
  verse: string;   
  text: string;    
  savedAt: number;  
};

const KEY = 'HOLY_BIBLE_FAVORITES';

export async function getFavorites(): Promise<FavoriteVerse[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addFavorite(verse: FavoriteVerse): Promise<void> {
  const all = await getFavorites();
  const exists = all.find((v) => v.id === verse.id);
  if (!exists) {
    await AsyncStorage.setItem(KEY, JSON.stringify([verse, ...all]));
  }
}

export async function removeFavorite(id: string): Promise<void> {
  const all = await getFavorites();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter((v) => v.id !== id)));
}

export async function isFavorite(id: string): Promise<boolean> {
  const all = await getFavorites();
  return all.some((v) => v.id === id);
}