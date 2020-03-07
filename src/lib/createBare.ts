import { config } from './config';
import { createScoped } from './internal/createScoped';
import { CustomSignal } from './internal/CustomSignal';
import {
  ActionCreator,
  ActionTypeOf,
  BareStateMachineFactory,
  InputReducerState,
  Reducer,
  ReducerAction,
  ReducerState
} from './types';

/**
 * create a BareStateMachineFactory, a bare state machine can be useful to manage ui state in a centralized way.
 *
 * ### Example
 * ```ts
 * import { createBare } from '@ezy/makina'
 *
 * const factory = createBare({
 *   reducer: (state: boolean = false, action: { type: 'START_REFRESH' | 'STOP_REFRESH' }) => {
 *     switch (action.type) {
 *       case 'START_REFRESH':
 *         return true;
 *       case 'STOP_REFRESH':
 *         return false;
 *       default:
 *         return state;
 *     }
 *   }
 * });
 *
 * const stateMachine = factory.create()
 *
 * stateMachine.dispatch({ type: 'START_REFRESH' })
 * stateMachine.getState()
 * // => true
 * ```
 *
 * @param reducer     a reducer
 * @param selectors   an object with selector functions
 * @returns           a BareStateMachineFactory
 */
export function createBare<
  C extends { [key: string]: ActionCreator },
  R extends Reducer<any, ActionTypeOf<C[keyof C]>>,
  SEL extends { [key: string]: (state: Readonly<ReducerState<R>>) => any } = {}
>(
  module: {
    actionCreators?: C;
    reducer: R;
  },
  selectors: SEL & {
    [key: string]: (state: Readonly<ReducerState<R>>) => any;
  } = {} as any
): BareStateMachineFactory<C, R, SEL> {
  return {
    create: (initialState?: InputReducerState<R>) => {
      let state: Readonly<ReducerState<R>> = module.reducer(initialState, {
        type: undefined
      } as any);

      if (config.freeze) {
        state = config.freeze(state);
      }

      const customSignal = new CustomSignal<
        Readonly<ReducerState<R>>,
        ReducerAction<R>
      >();

      const dispatch = Object.assign(
        // base dispatch function
        (action: ReducerAction<R>): boolean => {
          const newState = module.reducer(state, action as any);
          if (newState !== state) {
            state = config.freeze ? config.freeze(newState) : newState;
            customSignal.dispatch(state, action);
            return true;
          }
          return false;
        },
        // create dispatchers from actionCreators
        Object.keys(module.actionCreators || {}).reduce((result, name) => {
          const actionCreator = module.actionCreators[name];
          result[name] = (...args) => dispatch(actionCreator(...args) as any);
          return result;
        }, {} as any)
      );

      function getState() {
        return state;
      }

      function subscribe(
        listener: (
          state: Readonly<ReducerState<R>>,
          action: ReducerAction<R>
        ) => void
      ): () => boolean {
        return customSignal.subscribe(listener);
      }

      const scopeds = Object.keys(selectors).reduce((result, selectorName) => {
        result[selectorName] = createScoped(
          selectors[selectorName],
          getState,
          subscribe,
          dispatch,
          selectorName
        );
        return result;
      }, {} as any);

      return {
        dispatch,
        getState,
        scopeds,
        subscribe
      };
    }
  };
}
