import { createBare } from './createBare';
import { compileCallChain } from './internal/compileCallChain';
import { createSpecializedDispatchers } from './internal/createSpecializedDispatchers';
import { CustomSignal } from './internal/CustomSignal';
import { mapObjectPropRecursive } from './internal/mapObjectPropRecursive';

import {
  ActionCreator,
  ActionTypeOf,
  FULLIO,
  InputReducerState,
  Reducer,
  ReducerAction,
  ReducerState,
  StateMachineFactory
} from './types';

/**
 * create a StateMachineFactory with a middlewares layer to access the outside world or dispatch a different action.
 * a state machine is useful to manage application state, call APIs through middlewares, etc...
 *
 * ### Example
 * ```ts
 * import { create, Middleware } from '@ezy/makina'
 *
 * const IO = {
 *    log: (...args: string[]) => {}
 *  };
 *
 * const factory = create({
 *    reducer: (state: number = 0, action: { type: 'INCREMENT' | 'DECREMENT' }) => {
 *      switch (action.type) {
 *       case 'INCREMENT':
 *         return state + 1;
 *       case 'DECREMENT':
 *         return state - 1;
 *       default:
 *         return state;
 *      }
 *    }
 *   },
 *   IO
 * );
 *
 * function logActionType (): Middleware<{ log: (type: string) => void }> {
 *  return (io) => {
 *    if (typeof io.log !== 'function') {
 *      throw new Error("io.log not found")
 *    }
 *    return (action, next) => {
 *      io.log(action.type)
 *      return next()
 *    }
 *  }
 * }
 *
 * factory.use(logActionType());
 *
 * const stateMachine = factory.create({ log: console.log }, 10)
 *
 * await stateMachine.dispatch({ type: 'INCREMENT' })
 * stateMachine.getState()
 * // => 'INCREMENT'
 * // => 11
 * ```
 *
 * @param mod         an object with 3 properties actionCreators, reducer and middlewares
 * @param defaultIO   an object with function for accessing the outside world
 * @param selectors   an object with selector functions
 * @returns           a StateMachineFactory
 */
export function create<
  C extends { [key: string]: ActionCreator },
  R extends Reducer<any, ActionTypeOf<C[keyof C]>>,
  IO = {},
  SEL extends { [key: string]: (state: Readonly<ReducerState<R>>) => any } = {}
>(
  mod: {
    actionCreators?: C;
    reducer: R;
    middlewares?: Array<
      (
        io: { [K in keyof FULLIO<IO, R, C>]: FULLIO<IO, R, C>[K] }
      ) => (
        action: ReducerAction<R>,
        next: () => Promise<boolean>
      ) => Promise<boolean>
    >;
  },
  defaultIO: IO = {} as any,
  selectors: SEL & {
    [key: string]: (state: Readonly<ReducerState<R>>) => any;
  } = {} as any
): StateMachineFactory<C, R, IO, SEL> {
  // for hot reloading
  const modReplaced = new CustomSignal<typeof mod, void>();

  // store global middlewares in reverse order.
  // @see: internal/compileCallChain.ts
  const middlewares: Array<(
    io: { [K in keyof FULLIO<IO, R, C>]: FULLIO<IO, R, C>[K] }
  ) => (
    action: ReducerAction<R>,
    next: () => Promise<boolean>
  ) => Promise<boolean>> = [];

  const bareStateMachineFactory = createBare(mod, selectors);

  function createStateMachine(
    overrideIO?: Partial<IO>,
    initialState?: InputReducerState<R>
  ) {
    const bareStateMachine = bareStateMachineFactory.create(initialState);

    const io: { [K in keyof FULLIO<IO, R, C>]: FULLIO<IO, R, C>[K] } = {
      ...defaultIO,
      ...(overrideIO || {}),
      dispatch,
      getState: bareStateMachine.getState
    } as any;

    // "compile" the middleware chain and the implementation function
    let callChain = compileCallChain<ReducerAction<R>, boolean>(
      (mod.middlewares || [])
        // we clone the middleware list here to avoid mutate the original when reverse
        .slice()
        .reverse()
        .concat(middlewares)
        .map(middleware => middleware(io)),
      bareStateMachine.dispatch
    );

    function dispatch(action: ReducerAction<R>): Promise<boolean> {
      try {
        return callChain(action);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    Object.assign(
      dispatch,
      createSpecializedDispatchers(dispatch, mod.actionCreators || {})
    );

    // when we recieve a modReplaced event we replace the middleware callChain and recreate the specialized dispatchers
    modReplaced.subscribe(function replaceMod(newMod) {
      // replace middleware callChain
      callChain = compileCallChain<ReducerAction<R>, boolean>(
        (newMod.middlewares || [])
          // we clone the middleware list here to avoid mutate the original when reverse
          .slice()
          .reverse()
          .concat(middlewares)
          .map(middleware => middleware(io)),
        bareStateMachine.dispatch
      );

      // replace specialized dispatchers
      Object.assign(
        dispatch,
        // remove the old specialized dispatchers before write the new ones
        Object.keys(dispatch).reduce((result, name) => {
          result[name] = undefined;
          return result;
        }, {}),
        createSpecializedDispatchers(dispatch, newMod.actionCreators || {})
      );
    });

    // replace the dispatch function for every scoped to include the right dispatch
    const scopeds = mapObjectPropRecursive(
      bareStateMachine,
      'scopeds',
      (scoped: any) => {
        return {
          ...scoped,
          dispatch
        };
      }
    );

    return {
      dispatch: dispatch as any,
      getState: bareStateMachine.getState,
      scopeds,
      subscribe: bareStateMachine.subscribe
    };
  }

  function replaceModule(newMod: typeof mod) {
    bareStateMachineFactory.replaceModule(newMod);
    modReplaced.dispatch(newMod);
  }

  const stateMachineFactory = {
    create: createStateMachine,
    replaceModule,
    use: (
      middleware: (
        io: { [K in keyof FULLIO<IO, R, C>]: FULLIO<IO, R, C>[K] }
      ) => (
        action: ReducerAction<R>,
        next: () => Promise<boolean>
      ) => Promise<boolean>
    ) => {
      middlewares.unshift(middleware);
      return stateMachineFactory;
    }
  };

  return stateMachineFactory;
}
