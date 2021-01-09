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
export class CustomSignal<S, A, T, CT> {
  private listeners: Array<
    (state: S, action: A, target: T, currentTarget: CT) => void
  > = [];

  public hasListeners() {
    return this.listeners.length > 0;
  }

  public subscribe(
    listener: (state: S, action: A, target: T, currentTarget: CT) => void
  ) {
    this.listeners.push(listener);
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

  public dispatch(state: S, action: A, target: T, currentTarget: CT) {
    const listeners = this.listeners;
    const totalListeners = listeners.length;
    if (totalListeners > 0) {
      if (totalListeners === 1) {
        listeners[0](state, action, target, currentTarget);
      } else {
        for (let index = 0; index < totalListeners; index++) {
          listeners[index](state, action, target, currentTarget);
        }
      }
    }
  }
}
