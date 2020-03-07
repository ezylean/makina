/**
 * create a single function from a reversed array of middleware and an implementtion
 * @note this function use partial evaluation.
 * @ignore
 */
export function createObjectFactory(
  keys: string[]
): (values: any[]) => { [key: string]: any } {
  keys = keys.map(key => JSON.stringify(key));
  // tslint:disable-next-line: function-constructor
  return new Function(
    'values',
    `return {
      ${keys.map((key, index) => `${key}: values[${index}]`).join(', ')}
    };`
  ) as any;
}
