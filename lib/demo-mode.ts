import { cookies } from 'next/headers';

export const DEMO_COOKIE = 'ideas_demo';

export async function isDemoMode(): Promise<boolean> {
  try {
    const store = await cookies();
    return store.get(DEMO_COOKIE)?.value === '1';
  } catch {
    return false;
  }
}
