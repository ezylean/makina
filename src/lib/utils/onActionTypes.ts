/**
 * a middleware modifier that only run it's input middleware on specific action types
 *
 * ### Example
 * ```js
 * import { onActionTypes } from '@ezy/makina'
 *
 * ...
 *
 * factory.use(onActionTypes(['INCREMENT'], logActionType()))
 *
 * ...
 *
 * ```
 *
 * @param actionTypes   a list of action types
 * @param middleware    the middleware to run when there is a match
 * @returns             a middleware
 */
export function onActionTypes<IO, A extends { type: string }>(
  actionTypes: string[],
  middleware: (
    io: IO
  ) => (action: A, next: () => Promise<boolean>) => Promise<boolean>
) {
  return (io: IO) => {
    const run = middleware(io);
    return (action: A, next: () => Promise<boolean>) => {
      return actionTypes.indexOf(action.type) !== -1
        ? run(action, next)
        : next();
    };
  };
}
