import {
  ActionCreator,
  CombinedAction,
  InputReducerState,
  Mapping,
  Middleware,
  Reducer,
  ReducersMapping,
  ReducerState,
  UnionToIntersection
} from '../types';
import { combineReducers } from './combineReducers';

/**
 * @ignore
 */
interface Module<IO> {
  actionCreators: Mapping<ActionCreator>;
  actionTypes: string[];
  middlewares: Array<Middleware<IO>>;
  reducer: Reducer;
}

/**
 * @ignore
 */
type Combinedreducer<M extends ReducersMapping> = (
  state: { readonly [K in keyof M]?: InputReducerState<M[K]> } | void,
  action: CombinedAction<M>
) => { readonly [K in keyof M]: ReducerState<M[K]> };

/**
 * combined module spec to create [[CombinedModule]]
 * expect only one key `modules` with a mapping of modules.
 * their`actionCreators`, `middlewares` and `actionTypes` will be merged
 * and their `reducer` will be combined using `combineReducers`
 */
export interface CombinedSpec<IO> {
  modules: Mapping<Module<IO>>;
}

/**
 * combined module
 * @see [[createModule]]
 */
export interface CombinedModule<IO, S extends CombinedSpec<IO>> {
  actionCreators: UnionToIntersection<
    S['modules'][keyof S['modules']]['actionCreators']
  >;
  actionTypes: S['modules'][keyof S['modules']]['actionTypes'];
  reducer: Combinedreducer<
    {
      [K in keyof S['modules']]: S['modules'][K]['reducer'];
    }
  >;
  middlewares: Array<Middleware<IO>>;
}

/**
 * @ignore
 */
export function createCombinedModule<IO extends {}, S extends CombinedSpec<IO>>(
  spec: S
): CombinedModule<IO, S> {
  let actionCreators: any = {};
  let actionTypes: string[] = [];
  let middlewares: Array<Middleware<IO>> = [];

  const reducer: any = combineReducers(
    Object.keys(spec.modules).reduce((result, name) => {
      // add modules ActionCreators
      actionCreators = {
        ...actionCreators,
        ...spec.modules[name].actionCreators
      };

      actionTypes = [...actionTypes, ...spec.modules[name].actionTypes];

      middlewares = [
        ...middlewares,
        // add sub midlewares with localized state getter
        ...spec.modules[name].middlewares.map(middleware => {
          return io =>
            middleware({ ...io, getState: () => io.getState()[name] });
        })
      ];

      // add to reducer mapping
      result[name] = spec.modules[name].reducer;
      return result;
    }, {})
  );

  return {
    actionCreators,
    actionTypes,
    middlewares,
    reducer
  };
}
