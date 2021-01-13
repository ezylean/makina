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
