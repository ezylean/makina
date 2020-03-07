import { createObjectFactory } from '../internal/createObjectFactory';
import { SelectorInput, SelectorResult, SelectorsMapping } from '../types';
import { mergeSelectors } from './mergeSelectors';

/**
 * Combine multiple selectors according to a mapping object
 *
 * ### Example
 * ```js
 * import { combineSelectors } from '@ezy/makina'
 *
 * const combined = combineSelectors({
 *   counter: (state) => state.counter,
 *   todos: (state) => state.todos
 * });
 *
 * console.log(combined({ counter: 10, someOther: 'not interesting' }))
 * // => { counter: 10, todos: undefined }
 * ```
 *
 * ### IMPORTANT
 * selectors are tested to determine if they work properly, they should NEVER produce data structures (Object, Array, etc...)
 * and you shouldn't memoize them yourself either.
 *
 * #### DONT
 *
 * ```js
 *   const selector = state => ({ counter: state.counter, todos: state.todos });
 * ```
 *
 * @param mapping   a literal object where every key is a selector
 * @returns         a selector that return an object where every key is the corresponding selector result
 * @note            the returned selector will perform memoization on it's input selectors result after the first call.
 */
export function combineSelectors<M extends SelectorsMapping>(
  mapping: M
): (
  state: SelectorInput<M[keyof M]>
) => { [K in keyof M]: SelectorResult<M[K]> } {
  const keys = Object.keys(mapping);
  const createObject = createObjectFactory(keys);

  return mergeSelectors(
    keys.map(key => mapping[key]),
    createObject as any
  );
}
