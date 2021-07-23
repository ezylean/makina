import { CustomSignal } from './internal/CustomSignal';
import { StateContainer } from './StateContainer';
import { Lens, SplitLens } from './lenses';
import { Plugins } from './plugins';

/**
 * @ignore
 */
export interface Constructor<T = any> {
  new (...args: any[]): T;
}

/**
 * options passed from a state machine to a sub state machine
 */
export interface Options {
  source: StateContainer<any, any>;
  lens: Lens<any, any> | SplitLens<any, any>;
}

/**
 * @ignore
 */
export interface RootOptions {
  broadcaster: CustomSignal<string, StateContainer<any, any>>;
  depth: 0;
}

/**
 * @ignore
 */
export interface LeafOptions<State> {
  broadcaster: CustomSignal<string, StateContainer<any, any>>;
  depth: number;
  getter: <ParentState>(parentState: ParentState) => State;
  setter: <ParentState>(state: State, parentState: ParentState) => ParentState;
  source: StateContainer<any, any>;
}

/**
 * @ignore
 */
type WithoutConstructorKeys<T> = {
  [P in keyof T]: T[P] extends new () => any ? never : P;
}[keyof T];

/**
 * @ignore
 */
export type WithoutConstructor<T> = Pick<T, WithoutConstructorKeys<T>>;

/**
 * @ignore
 */
export type $keys = keyof Plugins<any>;
/**
 * @ignore
 */
export type HKT<$ extends $keys, S> = Plugins<S>[$];

/**
 *
 */
export type StateContainerClass = WithoutConstructor<typeof StateContainer> &
  Constructor<StateContainer<any, any>>;
