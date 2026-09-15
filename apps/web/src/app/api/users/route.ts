import { relay } from '@/lib/relay';

export async function POST(request: Request) {
  return relay('/users', request, 'POST');
}
