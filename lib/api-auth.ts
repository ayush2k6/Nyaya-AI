import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) return null;

  const { data, error } = await supabase.auth.getUser(match[1]);
  return error || !data.user ? null : data.user;
}

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function boundedText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}
