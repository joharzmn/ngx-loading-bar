import { Subject, timer, of, Observable } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';

export interface ILoadingBarState {
  action: 'start' | 'complete' | 'set' | 'stop' | 'increment';
  value: number;
}

export class LoadingBarState extends Subject<ILoadingBarState> {
  state = {
    action: null,
    value: undefined,
  };

  private requests = null;
  next(state: Partial<ILoadingBarState>, emitEvent = true) {
    switch (state.action) {
      case 'start':
        if (this.state.value) {
          state.value = this.state.value;
        }

        this.requests = (this.requests || 0) + 1;
        break;
      case 'complete':
        if (this.requests <= 0) {
          return;
        }

        this.requests = (this.requests || 1) - 1;
        if (this.requests === 0) {
          state.action = 'stop';
        }
        break;
      case 'stop':
        this.requests = 0;
        break;
      default:
        if (state.action === 'increment') {
          state.value = this.increment(state.value);
        }
        state.action = this.requests > 0 ? 'start' : 'set';
        break;
    }

    const newState = {
      ...this.state,
      action: null,
      ...state,
    };

    this.state = newState;
    if (emitEvent) {
      super.next(this.state);
    }
  }

  select() {
    return this.pipe(
      switchMap((s) => this.timer$(s)),
    );
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
        map(t => (t === 0 ? { ...s } : { ...s, value: this.increment() })),
      );
    }

    return state$.pipe(
      map(next => <ILoadingBarState>({ ...next, action: 'set' })),
      tap((next) => this.next(next, false)),
    );
  }

  private increment(rnd = 0) {
    const stat = this.state.value;
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
