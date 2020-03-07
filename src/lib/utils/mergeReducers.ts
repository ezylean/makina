import {
  InputReducerState,
  Reducer,
  ReducerAction,
  ReducerState,
  UnionToIntersection
} from '../types';
import { partializeReducer } from './partializeReducer';

/**
 * merge a list of reducers
 *
 * ### Example
 * ```js
 * import { mergeReducers } from '@ezy/makina'
 *
 * ...
 *
 * const merged = mergeReducers(
 *   reducer1,
 *   reducer2
 * );
 *
 * console.log(merged(undefined, { type: 'SOME_ACTION' }))
 * // => { merged state of reducer1 and reducer2 }
 * ```
 *
 * @param ...reducers   a list of reducers
 * @returns             a merged reducer that return a merged state
 * @note                the returned reducer allow to pass partial state
 */
export function mergeReducers<
  RS extends Array<Reducer<{ [key: string]: any }>>,
  IS = UnionToIntersection<InputReducerState<RS[number]>>,
  S = UnionToIntersection<ReducerState<RS[number]>>
>(
  ...reducers: RS
): (
  state?: { readonly [K in keyof IS]?: IS[K] },
  action?: ReducerAction<RS[number]>
) => { readonly [K in keyof S]: S[K] } {
  const partializedReducers = reducers.map(partializeReducer);
  const totalReducers = partializedReducers.length;

  return (state, action) => {
    for (let index = 0; index < totalReducers; index++) {
      const newState = partializedReducers[index](state, action);
      if (newState !== state) {
        state = { ...state, ...newState };
      }
    }
    return state as any;
  };
}
