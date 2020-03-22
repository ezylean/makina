import {
  ActionTypeOf,
  InputReducerState,
  Middleware,
  ReducerState
} from '../types';
import {
  createSimpleModule,
  SimpleModule,
  SimpleSpec
} from './createSimpleModule';
import {
  createCombinedModule,
  CombinedModule,
  CombinedSpec
} from './createCombinedModule';
import { mergeReducers } from './mergeReducers';

export { SimpleModule, CombinedModule, SimpleSpec, CombinedSpec };

/**
 * @todo: doc
 */
export type MakinaSpec<IO> = SimpleSpec<IO> & CombinedSpec<IO>;

/**
 * @todo: doc
 */
export interface MakinaModule<IO, S extends MakinaSpec<IO>> {
  actionCreators: SimpleModule<IO, S>['actionCreators'] &
    CombinedModule<IO, S>['actionCreators'];
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
 * @todo: doc
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
    const subModulesActionTypes = spec.modules
      ? Object.keys(spec.modules).reduce((result, modName) => {
          const actionCreators = spec.modules[modName].actionCreators;

          return result.concat(
            Object.keys(actionCreators).map(name => actionCreators[name]().type)
          );
        }, [])
      : undefined;

    const simpleMod = createSimpleModule(spec, subModulesActionTypes);
    if (spec.modules) {
      const combinedMod = createCombinedModule(spec);

      return {
        actionCreators: {
          ...simpleMod.actionCreators,
          ...combinedMod.actionCreators
        },
        middlewares: [...simpleMod.middlewares, ...combinedMod.middlewares],
        reducer: mergeReducers(simpleMod.reducer, combinedMod.reducer)
      };
    }
    return simpleMod;
  }

  return createCombinedModule(spec);
}
