import {
  CombinedAction,
  InputReducerState,
  ReducersMapping,
  ReducerState
} from '../types';

/**
 * Combine multiple reducers according to a mapping object
 *
 * ### Example
 * ```js
 * import { combineReducers } from '@ezy/makina'
 *
 * ...
 *
 * const combined = combineReducers({
 *   counter,
 *   todos
 * });
 *
 * console.log(combined(undefined, { type: 'INCREMENT' }))
 * console.log(combined({ counter: 10}, { type: 'INCREMENT' }))
 * // => { counter: 1, todos: [] }
 * // => { counter: 11, todos: [] }
 * ```
 *
 * @param mapping   a literal object where every key is a reducer
 * @returns         a reducer that return an object where every key is the corresponding reducer state
 * @note            the returned reducer allow to pass partial state
 */
export function combineReducers<M extends ReducersMapping>(
  mapping: M
): (
  state: { readonly [K in keyof M]?: InputReducerState<M[K]> } | void,
  action: CombinedAction<M>
) => { readonly [K in keyof M]: ReducerState<M[K]> } {
  const props = Object.keys(mapping);
  const totalProps = props.length;
  return (state = {}, action) => {
    for (let index = 0; index < totalProps; index++) {
      const prop = props[index];
      const subState = mapping[prop](state[prop], action);
      if (subState !== state[prop]) {
        state = { ...state, [prop]: subState };
      }
    }
    return state as any;
  };
}
