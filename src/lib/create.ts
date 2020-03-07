import { createBare } from './createBare';
import { compileCallChain } from './internal/compileCallChain';
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
 * @param reducer     a reducer
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
  module: {
    actionCreators?: C;
    reducer: R;
  },
  defaultIO: IO = {} as any,
  selectors: SEL & {
    [key: string]: (state: Readonly<ReducerState<R>>) => any;
  } = {} as any
): StateMachineFactory<C, R, IO, SEL> {
  // store middlewares in reverse order.
  // @see: internal/compileCallChain.ts
  const middlewares: Array<(
    io: { [K in keyof FULLIO<IO, R>]: FULLIO<IO, R>[K] }
  ) => (
    action: ReducerAction<R>,
    next: () => Promise<boolean>
  ) => Promise<boolean>> = [];

  const bareStateMachineFactory = createBare(module, selectors);

  function createStateMachine(
    overrideIO?: Partial<IO>,
    initialState?: InputReducerState<R>
  ) {
    const bareStateMachine = bareStateMachineFactory.create(initialState);

    const io: { [K in keyof FULLIO<IO, R>]: FULLIO<IO, R>[K] } = {
      ...defaultIO,
      ...(overrideIO || {}),
      dispatch,
      getState: bareStateMachine.getState
    } as any;

    // "compile" the middleware chain and the implementation function
    const callChain = compileCallChain<ReducerAction<R>, boolean>(
      middlewares.map(middleware => middleware(io)),
      bareStateMachine.dispatch
    );

    function dispatch(action: ReducerAction<R>): Promise<boolean> {
      try {
        return callChain(action);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    if (module.actionCreators) {
      Object.assign(
        dispatch,
        // create dispatchers from actionCreators
        Object.keys(module.actionCreators).reduce((result, name) => {
          const actionCreator = module.actionCreators[name];
          result[name] = (...args) => dispatch(actionCreator(...args) as any);
          return result;
        }, {} as any)
      );
    }

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

  const stateMachineFactory = {
    create: createStateMachine,
    use: (
      middleware: (
        io: { [K in keyof FULLIO<IO, R>]: FULLIO<IO, R>[K] }
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
