/**
 * A Signal is like an Event emitter but for only one event.
 * This is a custom signal class that dipatch up to 4 arguments to it's listeners
 *
 * ### Usage
 * ```js
 * const signal = new CustomSignal()
 *
 * signal.subscribe((arg1, arg2) => console.log('first listener', arg1, arg2))
 * signal.subscribe((arg1, arg2) => console.log('second listener', arg1, arg2))
 *
 * signal.dispatch('hello', 'world')
 * // => 'first listener', 'hello', 'world'
 * // => 'second listener', 'hello', 'world'
 * ```
 * @ignore
 */

export class CustomSignal<A0 = void, A1 = void, A2 = void, A3 = void> {
  private listeners: Array<{
    priority;
    handler: (arg0: A0, arg1: A1, arg2: A2, arg3: A3) => void;
  }> = [];

  public hasListeners() {
    return this.listeners.length > 0;
  }

  public subscribe(
    handler: (arg0: A0, arg1: A1, arg2: A2, arg3: A3) => void,
    priority = 0
  ) {
    const listener = {
      handler,
      priority,
    };

    this.listeners.push(listener);

    // high priority first
    this.listeners.sort((a, b) =>
      a.priority > b.priority ? -1 : a.priority < b.priority ? 1 : 0
    );

    return () => {
      const id = this.listeners.indexOf(listener);
      if (id !== -1) {
        this.listeners = this.listeners.slice();
        this.listeners.splice(id, 1);
        return true;
      }
      return false;
    };
  }

  public dispatch(arg0: A0, arg1: A1, arg2: A2, arg3: A3) {
    const listeners = this.listeners;
    const totalListeners = listeners.length;
    if (totalListeners > 0) {
      if (totalListeners === 1) {
        listeners[0].handler(arg0, arg1, arg2, arg3);
      } else {
        for (let index = 0; index < totalListeners; index++) {
          listeners[index].handler(arg0, arg1, arg2, arg3);
        }
      }
    }
  }
}
