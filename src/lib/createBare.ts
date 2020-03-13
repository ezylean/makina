import { config } from './config';
import { createScoped } from './internal/createScoped';
import { createSpecializedDispatchers } from './internal/createSpecializedDispatchers';
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
 * @param mod         an object with 3 properties actionCreators, reducer and middlewares
 * @param selectors   an object with selector functions
 * @returns           a BareStateMachineFactory
 */
export function createBare<
  C extends { [key: string]: ActionCreator },
  R extends Reducer<any, ActionTypeOf<C[keyof C]>>,
  SEL extends { [key: string]: (state: Readonly<ReducerState<R>>) => any } = {}
>(
  mod: {
    actionCreators?: C;
    reducer: R;
  },
  selectors: SEL & {
    [key: string]: (state: Readonly<ReducerState<R>>) => any;
  } = {} as any
): BareStateMachineFactory<C, R, SEL> {
  // for hot reloading
  const modReplaced = new CustomSignal<typeof mod, void>();

  function createStateMachine(initialState?: InputReducerState<R>) {
    let state: Readonly<ReducerState<R>> = mod.reducer(initialState, {
      type: undefined
    } as any);

    if (config.freeze) {
      state = config.freeze(state);
    }

    const stateChanged = new CustomSignal<
      Readonly<ReducerState<R>>,
      ReducerAction<R>
    >();

    // base dispatch function
    const baseDispatch = (action: ReducerAction<R>): boolean => {
      const newState = mod.reducer(state, action as any);
      if (newState !== state) {
        state = config.freeze ? config.freeze(newState) : newState;
        stateChanged.dispatch(state, action);
        return true;
      }
      return false;
    };

    // tslint:disable-next-line: prefer-object-spread
    const dispatch = Object.assign(
      baseDispatch,
      createSpecializedDispatchers(baseDispatch, mod.actionCreators || {})
    );

    // when we recieve a modReplaced event we replace the reducer and recreate the specialized dispatchers
    modReplaced.subscribe(function replaceMod(newMod) {
      // replace reducer
      mod.reducer = newMod.reducer;

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

    function getState() {
      return state;
    }

    function subscribe(
      listener: (
        state: Readonly<ReducerState<R>>,
        action: ReducerAction<R>
      ) => void
    ): () => boolean {
      return stateChanged.subscribe(listener);
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

  function replaceModule(newMod: typeof mod) {
    modReplaced.dispatch(newMod);
  }

  return {
    create: createStateMachine,
    replaceModule
  };
}
