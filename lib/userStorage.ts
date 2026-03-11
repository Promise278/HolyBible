import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredUser = {
  name: string;
  email: string;
  photo?: string | null;
  initial: string;
};

const USER_KEY = 'bible_app_user';

export async function saveUser(user: StoredUser) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<StoredUser | null> {
  const value = await AsyncStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
}

export async function removeUser() {
  await AsyncStorage.removeItem(USER_KEY);
}