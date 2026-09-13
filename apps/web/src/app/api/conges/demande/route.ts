import { relay } from '@/lib/relay';

export function POST(request: Request) {
  return relay('/leaves', request);
}
