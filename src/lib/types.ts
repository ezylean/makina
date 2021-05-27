import { Filterables } from '@umoja/filterable';
import { Base } from './Base';
import { CustomSignal } from './internal/CustomSignal';
import { Lens, SplitLens } from './lenses';

/**
 * @ignore
 */
export interface Mapping<T = any> {
  [name: string]: T;
}

/**
 * @ignore
 */
type Clean<T> = T extends infer U & {} ? U : T;

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
type CombinedState<T extends object> = Optional<T, MayBeEmptyObjectKeys<T>>;

/**
 * @ignore
 */
type UnionToIntersection<U> = (U extends any
? (k: U) => void
: never) extends (k: infer I) => void
  ? I
  : never;

/**
 * @ignore
 */
type PickAndFlatten<T, K extends keyof T> = UnionToIntersection<T[K]>;

/**
 * @ignore
 */
type CombinedIO<T extends object> = Partial<
  PickAndFlatten<T, keyof T> & { [K in keyof T]: Partial<T[K]> }
>;

export { Filterables };

/**
 * options passed from a state machine to a sub state machine
 */
export interface Options {
  source: StateMachine;
  lens: Lens<any, any> | SplitLens<any, any>;
}

/**
 * @ignore
 */
export interface RootOptions {
  broadcaster: CustomSignal<string, StateMachine>;
  depth: 0;
}

/**
 * @ignore
 */
export interface LeafOptions<State> {
  broadcaster: CustomSignal<string, StateMachine>;
  depth: number;
  getter: <ParentState>(parentState: ParentState) => State;
  setter: <ParentState>(state: State, parentState: ParentState) => ParentState;
  source: StateMachine;
}

/**
 * state machine constructor
 */
export type StateMachineCtor<
  State = any,
  IOs extends Mapping = any,
  M extends Mapping<StateMachineCtor> = any
> = new (
  initialState: FullState<State, M>,
  IO?: FullIO<IOs, M>,
  options?: Options
) => StateMachine<State, IOs, M>;

/**
 * @ignore
 */
export type FullState<S, M extends Mapping<StateMachineCtor>> = Clean<
  S & CombinedState<{ [K in keyof M]: ConstructorParameters<M[K]>[0] }>
>;

/**
 * @ignore
 */
type FullStateComplete<S, M extends Mapping<StateMachineCtor>> = Clean<
  S & CombinedState<{ [K in keyof M]: InstanceType<M[K]>['state'] }>
>;

/**
 * @ignore
 */
export type FullIO<IO, M extends Mapping<StateMachineCtor>> = Clean<
  IO & CombinedIO<{ [K in keyof M]: ConstructorParameters<M[K]>[1] }>
>;

/**
 * @ignore
 */
type WithoutConstructorKeys<T> = {
  [P in keyof T]: T[P] extends new () => any ? never : P;
}[keyof T];

/**
 * @ignore
 */
type WithoutConstructor<T> = Pick<T, WithoutConstructorKeys<T>>;

/**
 * instance of a state machine constructor
 */
export type StateMachine<
  State = any,
  IO extends Mapping = any,
  M extends Mapping<StateMachineCtor> = any
> = Base<FullStateComplete<State, M>, FullIO<IO, M>> &
  {
    [K in keyof M]: Filterables<InstanceType<M[K]>>;
  };

/**
 * @ignore
 */
export type StateMachineBase<
  M extends Mapping<StateMachineCtor> = {}
> = WithoutConstructor<typeof Base> &
  (new <State = {}, IO extends Mapping = {}>(
    initialState: FullState<State, M>,
    IO?: FullIO<IO, M>,
    options?: Options
  ) => StateMachine<State, IO, M>);
