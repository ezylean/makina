/**
 * attach a mapping of child selectors to a parent selector.
 *
 * use this function if you want to create scoped app inside scoped app
 *
 * @param selector         a parent selector
 * @param childSelectors   a mapping of child selectors
 * @returns                a copy of the parent selector with it's childs attached
 */
export function extendSelector<
  S,
  D,
  SUB extends { [key: string]: (subState: D) => any }
>(selector: (state: S) => D, childSelectors: SUB): ((state: S) => D) & SUB {
  return Object.assign(selector.bind(undefined), childSelectors);
}
