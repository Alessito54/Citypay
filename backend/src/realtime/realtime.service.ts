import { Injectable, MessageEvent } from '@nestjs/common';
import { interval, map, merge, Observable, Subject } from 'rxjs';

export type RealtimeEventType =
  | 'report.created'
  | 'report.updated'
  | 'payment.created'
  | 'payment.reconciled'
  | 'heartbeat';

export interface RealtimePayload<T = unknown> {
  type: RealtimeEventType;
  timestamp: string;
  data: T;
}

@Injectable()
export class RealtimeService {
  private readonly bus = new Subject<RealtimePayload>();

  emit<T>(type: Exclude<RealtimeEventType, 'heartbeat'>, data: T) {
    this.bus.next({
      type,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  stream(): Observable<MessageEvent> {
    const events$ = this.bus.asObservable();
    const heartbeat$ = interval(25_000).pipe(
      map(
        (): RealtimePayload => ({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          data: null,
        }),
      ),
    );

    return merge(events$, heartbeat$).pipe(
      map((event) => ({
        type: event.type,
        data: event,
      })),
    );
  }
}
