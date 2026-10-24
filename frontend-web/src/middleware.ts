import { NextResponse, type NextRequest } from 'next/server';
import PocketBase from 'pocketbase';

// Prefijo de ruta → rol requerido. La API vuelve a verificar el rol en cada request.
const PROTECTED: ReadonlyArray<[prefix: string, role: string]> = [
  ['/dashboard', 'admin'],
  ['/vet', 'vet'],
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const required = PROTECTED.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!required) return NextResponse.next();

  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  pb.authStore.loadFromCookie(request.headers.get('cookie') ?? '');

  if (!pb.authStore.isValid || pb.authStore.record?.role !== required[1]) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
