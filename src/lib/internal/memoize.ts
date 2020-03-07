/**
 * a simple arity 1 memoize function that only remember the last call
 *
 * @param fn                the function memoize
 * @returns                 the memoized function
 * @ignore
 */
export function memoize<S1, S2>(fn: (arg: S1) => S2): (arg: S1) => S2 {
  let lastArg: S1;
  let lastResult: S2;
  return arg => {
    if (lastArg === arg) {
      return lastResult;
    }
    lastArg = arg;
    return (lastResult = fn(arg));
  };
}
