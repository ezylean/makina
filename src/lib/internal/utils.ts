/**
 * a simple memoize function
 * take one argument and only remember the last argument passed
 * @ignore
 */
export function memoizeOne<I, O>(fn: (i: I) => O): (i: I) => O {
  let initialized = false;
  let lastArg;
  let lastResult;

  return (arg) => {
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

/**
 * @ignore
 */
export function valuesEqual(arr1: any[], arr2: any[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  if (arr1.length === 0) {
    return true;
  }

  for (let i = 0, len = arr1.length; i < len; i++) {
    if (arr2.indexOf(arr1[i]) === -1) {
      return false;
    }
  }
  return true;
}

/**
 * @ignore
 */
export function hashGrid<T extends string | number | symbol>(
  map: { [K in T]: T[] }
): { [K in T]: { [K2 in T]?: true } } {
  return Object.keys(map).reduce((grid, key) => {
    grid[key] = map[key].reduce((subGrid, value) => {
      subGrid[value] = true;
      return subGrid;
    }, {});

    return grid;
  }, {}) as any;
}
