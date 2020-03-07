/**
 * create a validate function that check if an object has all given keys as own property
 * @note this function use partial evaluation.
 *
 * ### Example
 * ```js
 * const isALegend = hasOwnProperties(['firstName', 'lastName'])
 * isALegend({ firstName: 'Michael' })
 * isALegend({ firstName: 'Michael', lastName: 'Jackson' })
 * // => false
 * // => true
 * ```
 *
 * @param keys              a list of keys
 * @returns                 a boolean returning function
 * @ignore
 */
export function hasOwnProperties(keys: string[]): (source: any) => boolean {
  keys = keys.map(key => JSON.stringify(key));
  // tslint:disable-next-line: function-constructor
  return new Function(
    'source',
    `return ${keys.map(key => `source.hasOwnProperty(${key})`).join(' && ')};`
  ) as any;
}
