// tslint:disable: prefer-for-of
import { hasOwnProperties } from '../internal/hasOwnProperties';
import {
  InputReducerState,
  Reducer,
  ReducerAction,
  ReducerState
} from '../types';
/**
 * take reducer and return an equivalent which can take partial state as argument
 *
 * @param reducer   a reducer (it's state must be an object)
 * @returns         an equivalent reducer
 */
export function partializeReducer<R extends Reducer>(
  reducer: R & ((state: { [key: string]: any }, action) => any)
): (
  state: void | { [K in keyof InputReducerState<R>]?: InputReducerState<R>[K] },
  action: ReducerAction<R>
) => ReducerState<R> {
  const props = Object.keys(reducer(undefined, { type: undefined }));
  const isComplete = hasOwnProperties(props);
  return (state, action) =>
    reducer(
      !state
        ? undefined
        : isComplete(state)
        ? state
        : { ...reducer(undefined, { type: undefined }), ...state },
      action
    );
}
