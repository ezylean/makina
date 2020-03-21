import { InferredAction } from '../types';
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

export function onActionTypes<
  IO,
  T extends string,
  A extends { type: string; [key: string]: any }
>(
  actionTypes: T[],
  middleware: (
    io: IO
  ) => (
    action: InferredAction<T, A>,
    next: () => Promise<boolean>
  ) => Promise<boolean>
) {
  if (actionTypes.length === 1) {
    const actionType = actionTypes[0];
    return (io: IO) => {
      const run = middleware(io);
      return (action: InferredAction<T, A>, next: () => Promise<boolean>) => {
        return action.type === actionType ? run(action, next) : next();
      };
    };
  }
  return (io: IO) => {
    const run = middleware(io);
    return (action: InferredAction<T, A>, next: () => Promise<boolean>) => {
      return actionTypes.indexOf(action.type) !== -1
        ? run(action, next)
        : next();
    };
  };
}
