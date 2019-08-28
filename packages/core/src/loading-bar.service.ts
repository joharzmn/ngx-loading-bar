import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LoadingBarState } from './loading-bar.state';

@Injectable({ providedIn: 'root' })
export class LoadingBarService {
  private state$ = new LoadingBarState();
  readonly progress$ = this.state$.select();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  start(initialValue = 2) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.state$.next({ action: 'start', value: initialValue });
  }

  stop() {
    this.state$.next({ action: 'stop' });
  }

  complete() {
    this.state$.next({ action: 'complete' });
  }

  set(value: number) {
    this.state$.next({ action: 'set', value });
  }

  increment(value = 0) {
    this.state$.next({ action: 'increment', value });
  }

  connect(source: string) {
    return {
      start: () => this.state$.next({ action: 'start', source, value: 2 }),
      complete: () => this.state$.next({ action: 'complete', source }),
    };
  }
}
