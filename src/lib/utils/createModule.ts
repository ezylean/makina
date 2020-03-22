import {
  ActionTypeOf,
  InputReducerState,
  Middleware,
  ReducerState
} from '../types';
import {
  CombinedModule,
  CombinedSpec,
  createCombinedModule
} from './createCombinedModule';
import {
  createSimpleModule,
  SimpleModule,
  SimpleSpec
} from './createSimpleModule';
import { mergeReducers } from './mergeReducers';

export { SimpleModule, CombinedModule, SimpleSpec, CombinedSpec };

/**
 * [[SimpleSpec]] and [[CombinedSpec]] combined
 *
 *  note: middlewares of this module will be triggered before it's submodules middlewares
 */
export type MakinaSpec<IO> = SimpleSpec<IO> & CombinedSpec<IO>;

/**
 *  module
 * @see [[createModule]]
 */
export interface MakinaModule<IO, S extends MakinaSpec<IO>> {
  actionCreators: SimpleModule<IO, S>['actionCreators'] &
    CombinedModule<IO, S>['actionCreators'];
  actionTypes:
    | SimpleModule<IO, S>['actionTypes']
    | CombinedModule<IO, S>['actionTypes'];
  reducer: (
    state: InputReducerState<SimpleModule<IO, S>['reducer']> &
      InputReducerState<CombinedModule<IO, S>['reducer']>,
    action: ActionTypeOf<
      (SimpleModule<IO, S>['actionCreators'] &
        CombinedModule<IO, S>['actionCreators'])[keyof (SimpleModule<
        IO,
        S
      >['actionCreators'] &
        CombinedModule<IO, S>['actionCreators'])]
    >
  ) => ReducerState<SimpleModule<IO, S>['reducer']> &
    ReducerState<CombinedModule<IO, S>['reducer']>;
  middlewares: Array<Middleware<IO>>;
}

/**
 * helper to create modules with automatic action creators module level middlewares and action level middlewares.
 * example:
 *
 * ```js
 * createModule({
 *  actions: {
 *    decrement: { type: DECREMENT },
 *    increment: { type: INCREMENT }
 *  },
 *  reducer: (state: number = 0, action) => {
 *    switch (action.type) {
 *      case 'INCREMENT':
 *        return state + 1;
 *      case 'DECREMENT':
 *        return state - 1;
 *      default:
 *        return state;
 *    }
 *  }
 *})
 *```
 */
export function createModule<IO extends {}, S extends MakinaSpec<IO>>(
  spec: S
): MakinaModule<IO, S>;
export function createModule<IO extends {}, S extends SimpleSpec<IO>>(
  spec: S
): SimpleModule<IO, S>;
export function createModule<IO extends {}, S extends CombinedSpec<IO>>(
  spec: S
): CombinedModule<IO, S>;
export function createModule(spec) {
  if (spec.reducer) {
    if (spec.modules) {
      const combinedMod = createCombinedModule(spec);
      const simpleMod = createSimpleModule(spec, combinedMod.actionTypes);

      return {
        actionCreators: {
          ...simpleMod.actionCreators,
          ...combinedMod.actionCreators
        },
        actionTypes: [...simpleMod.actionTypes, ...combinedMod.actionTypes],
        middlewares: [...simpleMod.middlewares, ...combinedMod.middlewares],
        reducer: mergeReducers(simpleMod.reducer, combinedMod.reducer)
      };
    }
    return createSimpleModule(spec);
  }
  return createCombinedModule(spec);
}
