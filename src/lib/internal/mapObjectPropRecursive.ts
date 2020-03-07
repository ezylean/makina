/**
 * recursively apply a function to a specific object property.
 * @ignore
 */
export function mapObjectPropRecursive<I, O>(
  source,
  prop: string,
  fn: (obj: I) => O
) {
  return Object.keys(source[prop]).reduce((result, name) => {
    result[name] = fn(source[prop][name]);
    result[name][prop] = mapObjectPropRecursive(result[name], prop, fn);
    return result;
  }, {} as any);
}
