import { HKT, $keys } from './types';
import { StateContainer } from './StateContainer';
import { Constructor, WithoutConstructor } from './types';
import { plugins, Plugins } from './plugins';

/**
 * @ignore
 */
type Spec = {
  [K in keyof Plugins<any>]?: Parameters<HKT<K, any>>[0];
};

/**
 * @ignore
 */
type SpecBasedPlugins<S extends Spec> = {
  [K in keyof S]: ReturnType<ReturnType<HKT<K & $keys, S[K]>>>;
};

/**
 * @ignore
 */
type GlobalPlugins<S extends Spec> = {
  [K in Exclude<keyof Plugins<any>, keyof S>]: Parameters<
    Plugins<S>[K]
  >['length'] extends 1
    ? never
    : ReturnType<ReturnType<HKT<K & $keys, S[K]>>>;
};

/**
 * @ignore
 */
type Values<T extends Record<string, any>> = Exclude<
  T[keyof T],
  typeof StateContainer
>;

/**
 * @ignore
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/**
 * @ignore
 */
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * @ignore
 */
type NoCommon<T> = T extends object
  ? RequiredKeys<T> extends never
    ? object & T
    : T
  : T;

/**
 * @ignore
 */
type Merge<C extends Constructor> = WithoutConstructor<
  typeof StateContainer
> & {
  new <
    S extends NoCommon<
      UnionToIntersection<ConstructorParameters<C>[0]>
    > = NoCommon<UnionToIntersection<ConstructorParameters<C>[0]>>,
    IO extends NoCommon<
      UnionToIntersection<ConstructorParameters<C>[1]>
    > = NoCommon<UnionToIntersection<ConstructorParameters<C>[1]>>
  >(
    initialState: S,
    IO?: IO,
    options?: UnionToIntersection<ConstructorParameters<C>[2]>
  ): StateContainer<S, IO> & UnionToIntersection<InstanceType<C>>;
};

/**
 * create a state machine base class to be extended
 *
 * @param spec
 */
export function createBase<S extends Spec = {}>(
  spec: S = {} as any
): keyof S extends never
  ? Merge<Values<GlobalPlugins<S>>>
  : Merge<Values<GlobalPlugins<S> & SpecBasedPlugins<S>>> {
  const globalPlugins = Object.keys(plugins).filter(
    (prop) => plugins[prop].length === 0 && !(prop in spec)
  );
  const specBasedPlugins = Object.keys(spec);

  return [...globalPlugins, ...specBasedPlugins].reduce((base, prop, idx) => {
    return idx < globalPlugins.length
      ? plugins[prop]()(base)
      : plugins[prop](spec[prop])(base);
  }, StateContainer);
}
