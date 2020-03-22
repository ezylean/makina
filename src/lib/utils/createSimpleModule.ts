import {
  ActionCreator,
  ActionTypeOf,
  InputReducerState,
  Mapping,
  Middleware,
  Reducer,
  ReducerState
} from '../types';
import { onActionTypes } from './onActionTypes';

/**
 * @ignore
 */
interface ActionSpec<IO> {
  type: string;
  creator?: ActionCreator;
  middlewares?: Array<Middleware<IO>>;
}

/**
 * @ignore
 */
interface ActionSpecWithCreator<IO> {
  type: string;
  creator: ActionCreator;
  middlewares?: Array<Middleware<IO>>;
}

/**
 * @ignore
 */
type ActionSpecToActionCreator<
  AS extends ActionSpec<any>
> = AS extends ActionSpecWithCreator<any>
  ? AS['creator']
  : () => { type: AS['type'] };

/**
 * @ignore
 */
type ActionsToActionCreators<M extends Mapping<ActionSpec<any>>> = {
  [K in keyof M]: ActionSpecToActionCreator<M[K]>;
};

/**
 * @todo: doc
 */
export interface SimpleSpec<IO> {
  actions: Mapping<ActionSpec<IO>>;
  reducer: Reducer;
  middlewares?: Array<Middleware<IO>>;
}

/**
 * @todo: doc
 */
export interface SimpleModule<IO, S extends SimpleSpec<IO>> {
  actionTypes: Array<S['actions'][keyof S['actions']]['type']>;
  actionCreators: {
    [K in keyof S['actions']]: ActionSpecToActionCreator<S['actions'][K]>;
  };
  reducer: (
    state: InputReducerState<S['reducer']>,
    action: ActionTypeOf<
      ActionsToActionCreators<S['actions']>[keyof ActionsToActionCreators<
        S['actions']
      >]
    >
  ) => ReducerState<S['reducer']>;
  middlewares: Array<Middleware<IO>>;
}

/**
 * @todo: doc
 * @ignore
 */
export function createSimpleModule<IO extends {}, S extends SimpleSpec<IO>>(
  spec: S,
  subModulesActionTypes: string[] = []
): SimpleModule<IO, S> {
  const actionCreators: any = {};
  let middlewares: Array<Middleware<IO>> = [];

  const actionTypes = Object.keys(spec.actions).map(
    name => spec.actions[name].type
  );

  // middlewares are executed in a global to specific order
  // so we add module level middlewares first
  if (spec.middlewares) {
    // module level middlewares also wrap sub modules
    // so we also add their action types
    const allActionTypes = actionTypes.concat(subModulesActionTypes);

    middlewares = [
      ...middlewares,
      ...spec.middlewares.map(middleware =>
        onActionTypes(allActionTypes, middleware)
      )
    ];
  }

  Object.keys(spec.actions).forEach(name => {
    const action = spec.actions[name];
    actionCreators[name] = action.creator
      ? action.creator
      : () => ({ type: action.type });
    if (action.middlewares) {
      action.middlewares.forEach(middleware => {
        middlewares.push(onActionTypes([action.type], middleware));
      });
    }
  });

  return {
    actionCreators,
    actionTypes,
    middlewares,
    reducer: spec.reducer
  };
}
