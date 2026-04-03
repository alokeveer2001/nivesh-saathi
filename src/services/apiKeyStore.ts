import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = '@nivesh_saathi_api_key';

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(API_KEY_STORAGE);
}

export async function setApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_STORAGE, key);
}

export async function removeApiKey(): Promise<void> {
  await AsyncStorage.removeItem(API_KEY_STORAGE);
}

