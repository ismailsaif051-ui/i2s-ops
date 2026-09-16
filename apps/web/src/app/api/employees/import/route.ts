import { relay } from '@/lib/relay';

export async function POST(request: Request) {
  return relay('/employees/import', request, 'POST');
}
