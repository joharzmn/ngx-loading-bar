import { Subject, timer, of, Observable } from 'rxjs';
import { map, switchMap, take, tap, filter, pairwise } from 'rxjs/operators';

export interface ILoadingBarState {
  action: 'start' | 'complete' | 'set' | 'stop' | 'increment';
  value: number;
  source: string;
}

export class LoadingBarState extends Subject<Partial<ILoadingBarState>> {
  // state = {
  //   action: null,
  //   source: null,
  //   value: undefined,
  // };

  private requests = null;

  select(source?: string) {
    return this.pipe(
      filter(s => !source || s.source === source),
      pairwise(),
      map(([prev, next]) => this.getNextState(prev, next)),
      switchMap((s) => this.timer$(s)),
      map(s => s.value),
    );
  }

  private getNextState(prev, next) {
    switch (next.action) {
      case 'start':
        if (prev.value) {
          next.value = prev.value;
        }

        this.requests = (this.requests || 0) + 1;
        break;
      case 'complete':
        if (this.requests > 0) {
          this.requests = (this.requests || 1) - 1;
        }

        if (this.requests === 0) {
          next.action = 'stop';
        }
        break;
      case 'stop':
        this.requests = 0;
        break;
      default:
        if (next.action === 'increment') {
          next.value = this.increment(next.value);
        }
        next.action = this.requests > 0 ? 'start' : 'set';
        break;
    }

    return {
      ...prev,
      action: null,
      ...next,
    };
  }

  private timer$ = (s: ILoadingBarState) => {
    let state$: Observable<Partial<ILoadingBarState>> = of(s);
    if (s.action === 'stop') {
      // Attempt to aggregate any start/complete calls within 500ms:
      state$ = s.value === 0 ? of({ ...s }) : timer(0, 500).pipe(
        take(2),
        map(t => ({ value: t === 1 ? 0 : 100 })),
      );
    } else if (s.action === 'start') {
      state$ = timer(0, 250).pipe(
        map(t => (t === 0 ? { ...s } : { ...s, value: this.increment(s.value) })),
      );
    }

    return state$.pipe(
      map(next => <ILoadingBarState>({ ...next, action: 'set' })),
      // tap((next) => this.next(next, false)),
    );
  }

  private increment(stat, rnd = 0) {
    if (stat >= 99) {
      rnd = 0;
    }

    if (rnd === 0) {
      if (stat >= 0 && stat < 25) {
        // Start out between 3 - 6% increments
        rnd = (Math.random() * (5 - 3 + 1) + 3);
      } else if (stat >= 25 && stat < 65) {
        // increment between 0 - 3%
        rnd = (Math.random() * 3);
      } else if (stat >= 65 && stat < 90) {
        // increment between 0 - 2%
        rnd = (Math.random() * 2);
      } else if (stat >= 90 && stat < 99) {
        // finally, increment it .5 %
        rnd = 0.5;
      } else {
        // after 99%, don't increment:
        rnd = 0;
      }
    }

    return rnd + stat;
  }
}
