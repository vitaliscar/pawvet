import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';

/** Cliente PocketBase para Server Components / Route Handlers — carga la sesión desde la cookie. */
export async function createServerPb() {
  const cookieStore = await cookies();
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  pb.authStore.loadFromCookie(`pb_auth=${cookieStore.get('pb_auth')?.value ?? ''}`);
  return pb;
}
