import { Filterables } from '@umoja/filterable';
import { Options, StateContainerClass } from '../types';
import { taskRunner } from '../internal/utils';
import { splitLensProp } from '../lenses';
import { StateContainer } from '../StateContainer';

declare module './index' {
  interface Plugins<S> {
    modules: S extends modulesOptions
      ? (options: { [key: string]: StateContainerClass }) => (
          Base: StateContainerClass
        ) => {
          new (
            initialState: OptionalEmptyObjectProperties<
              { [K in keyof S]: ConstructorParameters<S[K]>[0] }
            >,
            IO?: AllowFlatten<
              OptionalEmptyObjectProperties<
                { [K in keyof S]: ConstructorParameters<S[K]>[1] }
              >
            >,
            options?: Options
          ): StateContainerTree<S> &
            StateContainer<
              StateTree<S>,
              OptionalEmptyObjectProperties<
                { [K in keyof S]: ConstructorParameters<S[K]>[1] }
              >
            >;
        }
      : never;
  }
}

/**
 * @ignore
 */
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * @ignore
 */
type MayBeEmptyObjectKeys<T> = {
  [K in keyof T]-?: RequiredKeys<T[K]> extends never ? K : never;
}[keyof T];

/**
 * @ignore
 */
type Optional<T extends object, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * @ignore
 */
type OptionalEmptyObjectProperties<T extends object> = Optional<
  T,
  MayBeEmptyObjectKeys<T>
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
type PickAndFlatten<T, K extends keyof T> = UnionToIntersection<T[K]>;

/**
 * @ignore
 */
type AllowFlatten<T extends object> = Partial<
  PickAndFlatten<T, keyof T> & { [K in keyof T]: Partial<T[K]> }
>;

type StateTree<S extends modulesOptions> = {
  [K in keyof S]: InstanceType<S[K]>['state'];
};

type modulesOptions = { [key: string]: StateContainerClass };

type StateContainerTree<S extends modulesOptions> = {
  [K in keyof S]: Filterables<InstanceType<S[K]>>;
};

export function modules<S extends modulesOptions>(options: S) {
  return (Base: StateContainerClass) => {
    return class extends Base {
      constructor(...args: any[]) {
        super(...args);

        const IO = args[1] || {};

        Object.keys(options || {}).forEach((name) => {
          this[name] = this.create(
            splitLensProp<any>(name),
            options[name] as any,
            IO[name]
          );
        });

        this.ready = taskRunner.then(() => {
          return Promise.resolve(this.init()).then(() => this);
        });
      }
    } as any;
  };
}
