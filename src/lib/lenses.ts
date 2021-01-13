import {
  lens as Rlens,
  lensIndex as RlensIndex,
  lensPath as RlensPath,
  lensProp as RlensProp,
  over as Rover,
  set as Rset,
  view as Rview
} from 'ramda';

export type Functor<A> =
  | { ['fantasy-land/map']: <B>(fn: (a: A) => B) => Functor<B> }
  | { map: <B>(fn: (a: A) => B) => Functor<B> };

export type Lens<S, A> = (
  functorFactory: (a: A) => Functor<A>
) => (s: S) => Functor<S>;

export const lens: <S, A>(
  getter: (s: S) => A,
  setter: (a: A, s: S) => S
) => Lens<S, A> = Rlens as any;

export const lensProp: <T, K extends keyof T>(
  prop: K
) => Lens<T, T[K]> = RlensProp as any;

export const lensIndex: <T>(index: number) => Lens<T[], T> = RlensIndex as any;

export const lensPath: (<T, K0 extends keyof T = keyof T>(
  path: [K0]
) => Lens<T, T[K0]>) &
  (<T, K0 extends keyof T = keyof T, K1 extends keyof T[K0] = keyof T[K0]>(
    path: [K0, K1]
  ) => Lens<T, T[K0][K1]>) &
  (<
    T,
    K0 extends keyof T = keyof T,
    K1 extends keyof T[K0] = keyof T[K0],
    K2 extends keyof T[K0][K1] = keyof T[K0][K1]
  >(
    path: [K0, K1, K2]
  ) => Lens<T, T[K0][K1][K2]>) &
  (<
    T,
    K0 extends keyof T = keyof T,
    K1 extends keyof T[K0] = keyof T[K0],
    K2 extends keyof T[K0][K1] = keyof T[K0][K1],
    K3 extends keyof T[K0][K1][K2] = keyof T[K0][K1][K2]
  >(
    path: [K0, K1, K2, K3]
  ) => Lens<T, T[K0][K1][K2][K3]>) &
  (<
    T,
    K0 extends keyof T = keyof T,
    K1 extends keyof T[K0] = keyof T[K0],
    K2 extends keyof T[K0][K1] = keyof T[K0][K1],
    K3 extends keyof T[K0][K1][K2] = keyof T[K0][K1][K2],
    K4 extends keyof T[K0][K1][K2][K3] = keyof T[K0][K1][K2][K3]
  >(
    path: [K0, K1, K2, K3, K4]
  ) => Lens<T, T[K0][K1][K2][K3][K4]>) &
  ((path: Array<string | number>) => Lens<any, any>) = RlensPath as any;

export const view: (<S, A>(lens: Lens<S, A>, s: S) => A) &
  (<S, A>(lens: Lens<S, A>) => (s: S) => A) = Rview as any;

export const set: (<S, A>(lens: Lens<S, A>, a: A, s: S) => S) &
  (<S, A>(lens: Lens<S, A>) => (a: A, s: S) => S) &
  (<S, A>(lens: Lens<S, A>) => (a: A) => (s: S) => S) = Rset as any;

export const over: <S, A>(
  lens: Lens<S, A>,
  fn: (a: A) => A,
  s: S
) => S = Rover as any;

const findIndex = Array.prototype.findIndex.call.bind(
  Array.prototype.findIndex
);
const slice = Array.prototype.slice.call.bind(Array.prototype.slice);
const map = Array.prototype.map.call.bind(Array.prototype.map);
const sort = Array.prototype.sort.call.bind(Array.prototype.sort);

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
