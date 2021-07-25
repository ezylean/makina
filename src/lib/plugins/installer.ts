import { Plugins } from '.';

/**
 * @ignore
 */
export const plugins: Plugins<any> = {} as any;

export function install<K extends keyof Plugins<any>>(plugin: {
  name: K;
  decoratorFactory: Plugins<any>[K];
}) {
  if (plugins[plugin.name]) {
    throw new Error(`plugin ${plugin.name} already installed`);
  }

  plugins[plugin.name] = plugin.decoratorFactory;
}
