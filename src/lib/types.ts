/**
 * @ignore
 */
export type Reducer<S = any, A = { type: string; [key: string]: any }> = (
  state: S | void,
  action: A
) => S;

/**
 * @ignore
 */
export interface ReducersMapping {
  [key: string]: (
    state: any | void,
    action: { type: string; [key: string]: any }
  ) => any;
}

/**
 * @ignore
 */
export type ReducerState<R> = R extends (
  state: any | void,
  action: { type: string; [key: string]: any }
) => infer S
  ? S
  : never;

/**
 * @ignore
 */
export type InputReducerState<R> = R extends (
  state: infer S,
  action: { type: string; [key: string]: any }
) => any
  ? S
  : never;

/**
 * @ignore
 */
export type ReducerAction<R> = R extends (
  state: any | void,
  action: infer A
) => any
  ? A
  : never;

/**
 * @ignore
 */
export type ActionTypeOf<C> = C extends (...args) => infer A ? A : never;

/**
 * @ignore
 */
export type ActionCreator = (...args) => { type: string; [key: string]: any };

/**
 * @ignore
 */
export type CombinedAction<M> = ReducerAction<M[keyof M]>;

/**
 * @ignore
 */
export interface SelectorsMapping {
  [key: string]: (state: any) => any;
}

/**
 * @ignore
 */
export type UnionToIntersection<U> = (U extends any
? (k: U) => void
: never) extends (k: infer I) => void
  ? I
  : never;

/**
 * @ignore
 */
export type FULLIO<IO, R, C> = IO & {
  dispatch: ((action: ReducerAction<R>) => Promise<boolean>) &
    { [K in keyof C]: (...a: ArgumentTypes<C[K]>) => Promise<boolean> };
  getState: () => ReducerState<R>;
};

/**
 * @ignore
 */
export type Selector = (state: any) => any;

/**
 * @ignore
 */
export type SelectorInput<SEL> = SEL extends (state: infer S) => any
  ? S
  : never;

/**
 * @ignore
 */
export type SelectorResult<SEL> = SEL extends (state: any) => infer S
  ? S
  : never;

/**
 * infer specific actions based on list of action types
 * @see onActionTypes
 *
 * @ignore
 */
export type InferredAction<
  T,
  A extends { type: string; [key: string]: any }
> = A extends { type: T; [key: string]: any } ? A : never;

/**
 * a generic Middleware type for generic middlewares
 */
export type Middleware<IO = { [key: string]: any }, C = {}> = (
  io: FULLIO<IO, Reducer, C>
) => (
  action: { type: string; [key: string]: any },
  next: () => Promise<boolean>
) => Promise<boolean>;

/**
 * a generic Module type for module replacement
 * @ignore
 */
export interface Module {
  actionCreators?: { [key: string]: ActionCreator };
  reducer: Reducer;
  middlewares?: Middleware[];
}

/**
 * a generic BareModule type for module replacement
 * @ignore
 */
export interface BareModule {
  actionCreators?: { [key: string]: ActionCreator };
  reducer: Reducer;
}

/**
 * @ignore
 */
type ArgumentTypes<T> = T extends (...args: infer U) => any ? U : never;

/**
 * A StateMachineFactory define how the StateMachines he create behave
 */
export interface StateMachineFactory<
  C extends { [key: string]: ActionCreator },
  R extends Reducer<any, ActionTypeOf<C[keyof C]>>,
  IO = {},
  SEL extends { [key: string]: (state: Readonly<ReducerState<R>>) => any } = {}
> {
  /**
   * create a new StateMachine
   * @param overrideIO    a full or subset of the io provided to the factory (useful for testing)
   * @param initialState  an initialState (useful for testing or to restart from a saved state)
   * @returns             the StateMachine created
   */
  create: (
    overrideIO?: Partial<IO>,
    initialState?: InputReducerState<R>
  ) => StateMachine<C, ReducerState<R>, ReducerAction<R>, SEL>;
  /**
   * add a middleware to the call chain
   * @param middleware   [[Middleware]]
   * @returns            the StateMachineFactory
   */
  use: (
    middleware: (
      io: { [K in keyof FULLIO<IO, R, C>]: FULLIO<IO, R, C>[K] }
    ) => (
      action: ReducerAction<R>,
      next: () => Promise<boolean>
    ) => Promise<boolean>
  ) => StateMachineFactory<C, R, IO>;
  /**
   * replace the current module in the StateMachineFactory and in every StateMachine created
   *
   * @param newMod        an object with 3 properties: actionCreators, reducer and middlewares
   * @returns             void
   */
  replaceModule: (newMod: Module) => void;
}

/**
 * a StateMachine can have a finite or infinite possible states
 * but they always have one state at a time.
 * switching from the current state to a new state is done by sending an action to the StateMachine,
 * to do it use [[StateMachine.dispatch]].
 * to read the current state use [[StateMachine.getState]]
 * to get notified whenever the state change use [[StateMachine.subscribe]]
 */
export interface StateMachine<
  C extends { [key: string]: ActionCreator },
  S,
  A,
  SEL
> {
  /**
   * dispatch an action.
   * @param action    an action to dispatch
   * @return          a Promise of a boolean indicating if that action has changed the state
   *
   * @note this function have also attached to it a collection of dispatchers created from the action creators.
   * all return a Promise of boolean.
   */
  dispatch: ((action: A) => Promise<boolean>) &
    { [K in keyof C]: (...a: ArgumentTypes<C[K]>) => Promise<boolean> };
  /**
   * retireve the current state
   * @returns state
   */
  getState: () => Readonly<S>;
  /**
   * listen to state change.
   * @param listener    a listener function
   * @returns           an unsubscribe function
   * @note the listener also recieve the action who trigger that state
   */
  subscribe: (
    listener: (state: Readonly<S>, action: A) => void
  ) => () => boolean;
  /**
   * an object containing StateMachine childs matching the selectors provided to the factory.
   * all of them have the same dispatch function but their getState and subscribe function have the selector applied.
   */
  scopeds: {
    [K in keyof SEL]: StateMachine<C, SelectorResult<SEL[K]>, A, SEL[K]>;
  };
}

/**
 * A BareStateMachineFactory define how the BareStateMachines he create behave.
 */
export interface BareStateMachineFactory<
  C extends { [key: string]: ActionCreator },
  R extends Reducer<any, ActionTypeOf<C[keyof C]>>,
  SEL extends { [key: string]: (state: Readonly<ReducerState<R>>) => any } = {}
> {
  /**
   * create a new BareStateMachine
   * @param initialState  an initialState (useful for testing or to restart from a saved state)
   * @returns             the BareStateMachine created
   */
  create: (
    initialState?: InputReducerState<R>
  ) => BareStateMachine<C, ReducerState<R>, ReducerAction<R>, SEL>;
  /**
   * replace the current module in the BareStateMachineFactory and in every BareStateMachine created
   *
   * @param newMod        an object with 2 properties: actionCreators and reducer
   * @returns             void
   */
  replaceModule: (newMod: BareModule) => void;
}

/**
 * a BareStateMachine can have a finite or infinite possible states
 * but they always have one state at a time.
 * switching from the current state to a new state is done by sending an action to the BareStateMachine,
 * to do it use [[BareStateMachine.dispatch]].
 * to read the current state use [[BareStateMachine.getState]]
 * to get notified whenever the state change use [[BareStateMachine.subscribe]]
 *
 * @note unlike [[StateMachine]] BareStateMachine do not have middlewares and should not access the outside world
 */
export interface BareStateMachine<
  C extends { [key: string]: ActionCreator },
  S,
  A,
  SEL
> {
  /**
   * dispatch an action.
   * @param action    an action to dispatch
   * @return          a boolean indicating if that action has changed the state
   *
   * @note this function have also attached to it a collection of dispatchers created from the action creators.
   * all return a boolean.
   */
  dispatch: ((action: A) => boolean) &
    { [K in keyof C]: (...a: ArgumentTypes<C[K]>) => boolean };
  /**
   * retireve the current state
   * @returns state
   */
  getState: () => Readonly<S>;
  /**
   * listen to state change.
   * @param listener    a listener function
   * @returns           an unsubscribe function
   * @note the listener also recieve the action who trigger that state
   */
  subscribe: (
    listener: (state: Readonly<S>, action: A) => void
  ) => () => boolean;
  /**
   * an object containing BareStateMachine childs matching the selectors provided to the factory.
   * all of them have the same dispatch function but their getState and subscribe function have the selector applied.
   */
  scopeds: {
    [K in keyof SEL]: BareStateMachine<C, SelectorResult<SEL[K]>, A, SEL[K]>;
  };
}
