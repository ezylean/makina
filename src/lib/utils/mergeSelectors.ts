import { memoize } from '../internal/memoize';
import { Selector, SelectorInput, SelectorResult } from '../types';

/**
 * merge a list of selectors using a merge function
 *
 * ### Example
 * ```js
 * import { mergeSelectors } from '@ezy/makina'
 *
 * const merged = mergeSelectors([
 *   state => state.counter,
 *   state => state.todos
 * ], ([counter, todos]) => {
 *  return { counter, todos };
 * });
 *
 * console.log(merged({ counter: 10, someOther: 'not interesting' }))
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
 * @param inputSelectors   a list of selectors
 * @param merge            a merge function
 * @returns                a selector that return the result of the merge function
 * @note                   the returned selector will perform memoization on it's input selectors result after the first call.
 */

export function mergeSelectors<SEL extends [Selector, Selector], R>(
  inputSelectors: SEL,
  merge: (results: [SelectorResult<SEL[0]>, SelectorResult<SEL[1]>]) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors<SEL extends [Selector, Selector, Selector], R>(
  inputSelectors: SEL,
  merge: (
    results: [
      SelectorResult<SEL[0]>,
      SelectorResult<SEL[1]>,
      SelectorResult<SEL[2]>
    ]
  ) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors<
  SEL extends [Selector, Selector, Selector, Selector],
  R
>(
  inputSelectors: SEL,
  merge: (
    results: [
      SelectorResult<SEL[0]>,
      SelectorResult<SEL[1]>,
      SelectorResult<SEL[2]>,
      SelectorResult<SEL[3]>
    ]
  ) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors<
  SEL extends [Selector, Selector, Selector, Selector, Selector],
  R
>(
  inputSelectors: SEL,
  merge: (
    results: [
      SelectorResult<SEL[0]>,
      SelectorResult<SEL[1]>,
      SelectorResult<SEL[2]>,
      SelectorResult<SEL[3]>,
      SelectorResult<SEL[4]>
    ]
  ) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors<
  SEL extends [Selector, Selector, Selector, Selector, Selector, Selector],
  R
>(
  inputSelectors: SEL,
  merge: (
    results: [
      SelectorResult<SEL[0]>,
      SelectorResult<SEL[1]>,
      SelectorResult<SEL[2]>,
      SelectorResult<SEL[3]>,
      SelectorResult<SEL[4]>,
      SelectorResult<SEL[5]>
    ]
  ) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors<
  SEL extends [
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector
  ],
  R
>(
  inputSelectors: SEL,
  merge: (
    results: [
      SelectorResult<SEL[0]>,
      SelectorResult<SEL[1]>,
      SelectorResult<SEL[2]>,
      SelectorResult<SEL[3]>,
      SelectorResult<SEL[4]>,
      SelectorResult<SEL[5]>,
      SelectorResult<SEL[6]>
    ]
  ) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors<
  SEL extends [
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector
  ],
  R
>(
  inputSelectors: SEL,
  merge: (
    results: [
      SelectorResult<SEL[0]>,
      SelectorResult<SEL[1]>,
      SelectorResult<SEL[2]>,
      SelectorResult<SEL[3]>,
      SelectorResult<SEL[4]>,
      SelectorResult<SEL[5]>,
      SelectorResult<SEL[6]>,
      SelectorResult<SEL[7]>
    ]
  ) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors<
  SEL extends [
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector
  ],
  R
>(
  inputSelectors: SEL,
  merge: (
    results: [
      SelectorResult<SEL[0]>,
      SelectorResult<SEL[1]>,
      SelectorResult<SEL[2]>,
      SelectorResult<SEL[3]>,
      SelectorResult<SEL[4]>,
      SelectorResult<SEL[5]>,
      SelectorResult<SEL[6]>,
      SelectorResult<SEL[7]>,
      SelectorResult<SEL[8]>
    ]
  ) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors<
  SEL extends [
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector,
    Selector
  ],
  R
>(
  inputSelectors: SEL,
  merge: (
    results: [
      SelectorResult<SEL[0]>,
      SelectorResult<SEL[1]>,
      SelectorResult<SEL[2]>,
      SelectorResult<SEL[3]>,
      SelectorResult<SEL[4]>,
      SelectorResult<SEL[5]>,
      SelectorResult<SEL[6]>,
      SelectorResult<SEL[7]>,
      SelectorResult<SEL[8]>,
      SelectorResult<SEL[9]>
    ]
  ) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors<SEL extends Selector[], R>(
  inputSelectors: SEL,
  merge: (results: Array<SelectorResult<SEL[number]>>) => R
): (state: SelectorInput<SEL[number]>) => R;

export function mergeSelectors(inputSelectors, merge) {
  const totalSelector = inputSelectors.length;
  /**
   * memoization of input selectors could be done here
   * but we would not be able to determine if the selector work properly anymore
   * so memoization is delayed after the first call
   * @see [[createScoped]]
   */
  let isInputSelectorsMemoized = false;
  const args = Array(totalSelector);
  let lastResult;

  return state => {
    let shouldCompute = false;
    for (let index = 0; index < totalSelector; index++) {
      const arg = inputSelectors[index](state);
      if (arg !== args[index]) {
        shouldCompute = true;
        args[index] = arg;
      }
    }

    if (!isInputSelectorsMemoized) {
      isInputSelectorsMemoized = true;
      inputSelectors = inputSelectors.map(memoize);
    }

    return shouldCompute ? (lastResult = merge(args.slice())) : lastResult;
  };
}
