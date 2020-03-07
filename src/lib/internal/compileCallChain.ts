/**
 * create a single function from a reversed array of middleware and an implementtion
 *
 * ### Example
 * ```js
 * const callChain = compileCallChain(
 *  [
 *   (action, next) => { action.data += 'world'; return next(); },
 *   (action, next) => { action.data += ' '; return next(); },
 *   (action, next) => { action.data += 'hello'; return next(); }
 *  ],
 *  (action: { data: string }) => action.data
 * )
 * callChain({ data: '' }).then(console.log)
 * // => 'hello world'
 * ```
 *
 * @param chain             a reversed collection of middleware
 * @param implementation    the function to call after all middlewares
 * @returns                 a promise of the result of the implementation
 * @ignore
 */
export function compileCallChain<T, R>(
  chain: Array<(action: T, next: () => Promise<R>) => Promise<R>>,
  implementation: (action: T) => Promise<R> | R
): (action: T) => Promise<R> {
  // @ts-ignore
  return chain.reduce(
    (next, middleware) => {
      return (a1, subnext) => {
        return middleware(a1, () => next(a1, subnext));
      };
    },
    a1 => Promise.resolve(implementation(a1))
  );
}
