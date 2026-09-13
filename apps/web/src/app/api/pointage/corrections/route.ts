import { relay } from '@/lib/relay';

export function PUT(request: Request) {
  return relay('/timesheets/corrections', request, 'PUT');
}
