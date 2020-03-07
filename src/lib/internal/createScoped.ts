import { config } from '../config';
import { memoize } from './memoize';

/**
 * create a scoped app by deriving from a parent state through a selector
 * @note in javascript function are also object this function take advantage of that
 * to create a tree of scoped app if a selector have subselector.
 *
 * @param selector         the selector to use
 * @param getParentState   the parent app `getState`
 * @param parentSubscribe  the parent app `subscribe`
 * @param dispatch         the parent app `dispatch`
 * @returns                a scoped app
 * @ignore
 */
export function createScoped<S, D, A>(
  selector: (state: S) => D,
  getParentState: () => S,
  parentSubscribe: (listener: (state: S, action: A) => void) => () => boolean,
  dispatch: ((action: A) => boolean) & { [key: string]: (...args) => boolean },
  name: string
) {
  if (selector(getParentState()) !== selector(getParentState())) {
    throw new Error(`
      the selector ${name} return non-stricly equal values for the same subsequent input,
      consider using 'mergeSelectors' or 'combineSelectors'.
    `);
  }
  const memoizedSelector = memoize(selector);

  let selectorState = memoizedSelector(getParentState());

  function getState() {
    const newSelectorState = memoizedSelector(getParentState());
    if (selectorState !== newSelectorState) {
      selectorState = config.freeze
        ? config.freeze(newSelectorState)
        : newSelectorState;
    }
    return selectorState;
  }

  function subscribe(listener: (state: D, action: A) => void) {
    return parentSubscribe((receivedState, action) => {
      const newSelectorState = memoizedSelector(receivedState);
      if (selectorState !== newSelectorState) {
        selectorState = config.freeze
          ? config.freeze(newSelectorState)
          : newSelectorState;
        listener(selectorState, action);
      }
    });
  }

  // if the selector have other selector attached to it we create theses scoped app as well
  // @see utils/extendSelector.ts
  const scopeds = Object.keys(selector).reduce((result, selectorName) => {
    result[selectorName] = createScoped(
      selector[selectorName],
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
