/**
 * global configuration
 *
 */
export const config: {
  /**
   * consider activate in development to ensure
   * you're not mutating the state outside of your StateMachines.
   *
   *  ### Example
   * ```js
   * import { config } from '@ezy/makina'
   *
   * config.freeze = process.env.NODE_ENV !== 'production'? require('deep-freeze-strict') : null;
   * ```
   */
  freeze?: <S>(state: S) => Readonly<S>;
} = {};
