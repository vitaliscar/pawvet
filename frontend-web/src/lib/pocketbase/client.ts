'use client';

import PocketBase from 'pocketbase';

let pb: PocketBase | null = null;

/** Cliente PocketBase para Client Components — persiste la sesión en cookie compartida con el server. */
export function createClientPb(): PocketBase {
  if (pb) return pb;
  pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  pb.authStore.onChange(() => {
    document.cookie = pb!.authStore.exportToCookie({ httpOnly: false, path: '/' });
  }, true);
  return pb;
}
