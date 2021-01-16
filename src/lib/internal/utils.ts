/**
 * a simple memoize function
 * take one argument and only remember the last argument passed
 * @ignore
 */
export function memoizeOne<I, O>(fn: (i: I) => O): (i: I) => O {
  let initialized = false;
  let lastArg;
  let lastResult;

  return arg => {
    if (initialized && lastArg === arg) {
      return lastResult;
    }
    initialized = true;
    lastArg = arg;
    return (lastResult = fn(arg));
  };
}

/**
 * according to the [spec](https://promisesaplus.com/#point-36)
 * "callbacks must execute in the order of their originating calls to then"
 * @ignore
 */
export const taskRunner = Promise.resolve();
