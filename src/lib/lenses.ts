export type Functor<A> =
  | { ['fantasy-land/map']: <B>(fn: (a: A) => B) => Functor<B> }
  | { map: <B>(fn: (a: A) => B) => Functor<B> };

export type Lens<S, A> = (
  functorFactory: (a: A) => Functor<A>
) => (s: S) => Functor<S>;

export interface SplitLens<S, A> {
  get(s: S): A;
  set(a: A, s: S): S;
}

const Const = value => ({
  value,
  map() {
    return this;
  }
});
const Identity = value => ({ value, map: setter => Identity(setter(value)) });

/**
 *
 * @param lens
 * @param obj
 */
export function view<S, A>(lens: Lens<S, A>, obj: S): A {
  // @ts-ignore
  return lens(Const)(obj).value;
}

/**
 *
 * @param lens
 * @param obj
 */
export function set<S, A>(lens: Lens<S, A>, val: A, obj: S): S {
  // @ts-ignore
  return lens(() => Identity(val))(obj).value;
}

const findIndex = Array.prototype.findIndex.call.bind(
  Array.prototype.findIndex
);
const slice = Array.prototype.slice.call.bind(Array.prototype.slice);
const map = Array.prototype.map.call.bind(Array.prototype.map);
const sort = Array.prototype.sort.call.bind(Array.prototype.sort);

/**
 *
 * @param predicate
 */
export function lensFind<A>(predicate: (a: A) => boolean): Lens<A[], A> {
  return funcConst => {
    return s => {
      const index = findIndex(s, predicate);
      const f = funcConst(s[index]);
      const MAP =
        typeof f['fantasy-land/map'] === 'function'
          ? 'fantasy-land/map'
          : 'map';

      return f[MAP](a => {
        if (index === -1) {
          return s;
        }
        const result = slice(s);
        result[index] = a;
        return result;
      });
    };
  };
}

/**
 *
 * @param predicate
 */
export function lensFilter<A>(predicate: (a: A) => boolean): Lens<A[], A[]> {
  return funcConst => {
    return s => {
      const indexes = findIndexes(s, predicate);
      const f = funcConst(map(indexes, index => s[index]));
      const MAP =
        typeof f['fantasy-land/map'] === 'function'
          ? 'fantasy-land/map'
          : 'map';

      return f[MAP](a =>
        indexes.length === 0 ? s : setAtIndexes(s, indexes, a)
      );
    };
  };
}

/**
 *
 * @param compareFunction
 */
export function lensSort<A>(
  compareFunction: (a: A, b: A) => number = (a, b) =>
    a > b ? 1 : a < b ? -1 : 0
): Lens<A[], A[]> {
  return funcConst => {
    return s => {
      const tmp = sort(
        map(s, (value, index) => ({ index, value })),
        (a, b) => compareFunction(a.value, b.value)
      );
      const f = funcConst(map(tmp, el => el.value));
      const MAP =
        typeof f['fantasy-land/map'] === 'function'
          ? 'fantasy-land/map'
          : 'map';

      return f[MAP](a => {
        return setAtIndexes(
          s,
          map(tmp, el => el.index),
          a
        );
      });
    };
  };
}

function findIndexes(arr, predicate) {
  const results = [];
  for (let index = 0; index < arr.length; index++) {
    if (predicate(arr[index])) {
      results.push(index);
    }
  }
  return results;
}

function setAtIndexes(arr, indexes, values) {
  const result = arr.slice();
  for (let i = 0; i < indexes.length; i++) {
    result[indexes[i]] = values[i];
  }
  return result;
}

/**
 *
 * @param name
 */
export function splitLensProp<S, K extends keyof S = keyof S>(
  name: K
): SplitLens<S, S[K]> {
  return {
    get: s => s[name],
    set: (a, s) => ({ ...s, [name]: a })
  };
}

/**
 *
 * @param lens
 */
export function lensToSplitLens<S, A>(
  lens: Lens<S, A> | SplitLens<S, A>
): SplitLens<S, A> {
  if (typeof lens === 'function') {
    return {
      get: (s: S) => view(lens, s),
      set: (a: A, s: S) => set(lens, a, s)
    };
  }
  return lens as SplitLens<S, A>;
}
