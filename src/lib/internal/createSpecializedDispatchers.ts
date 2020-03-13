/**
 * create specialized dispatcher from a dispatch function and actions creators
 *
 * @param dispatch        the dispatch function
 * @param actionCreators  a mapping of actionCreators
 * @returns               a mapping of specialized dispatchers
 * @ignore
 */
export function createSpecializedDispatchers<T, R>(
  dispatch: (action: T) => R,
  actionCreators: { [key: string]: (...args) => T }
) {
  return Object.keys(actionCreators).reduce((result, name) => {
    const actionCreator = actionCreators[name];
    result[name] = (...args) => dispatch(actionCreator(...args) as any);
    return result;
  }, {} as any);
}
