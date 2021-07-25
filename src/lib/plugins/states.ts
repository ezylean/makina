import { Options, StateContainerClass } from '../types';
import { StateContainer } from '../StateContainer';
import { Constructor } from '../types';
import { install } from './installer';

declare module './index' {
  interface Plugins<S> {
    states: S extends statesOptions
      ? (options: {
          [key: string]: {
            is: (state: any) => boolean;
            set: (state: any, ...args) => any;
            from: Array<keyof S>;
          };
        }) => (Base: StateContainerClass) => {
          new (
            initialState: NoCommon<StateMachineState<S>>,
            IO?: {},
            options?: Options
          ): StateMachine<S>;
        }
      : never;
  }
}

/**
 * @ignore
 */
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * @ignore
 */
type NoCommon<T> = T extends object
  ? RequiredKeys<T> extends never
    ? object & T
    : T
  : T;

type statesOptions = {
  [key: string]: {
    is: (state: any) => boolean;
    set: (state: any, ...args) => any;
    from: Array<any>;
  };
};

/**
 * @ignore
 */
type StateMachineState<S extends statesOptions> = Parameters<
  S[keyof S]['is']
>[0];

/**
 * @ignore
 */
type ParametersOmitFirst<T extends (...args: any) => any> = T extends (
  first: any,
  ...args: infer P
) => any
  ? P
  : never;

declare class StateMachine<
  S extends {
    [key: string]: {
      is: (state: any) => boolean;
      set: (state: any, ...args) => any;
      from: Array<keyof S>;
    };
  }
> extends StateContainer<StateMachineState<S>> {
  public readonly is: { [K in keyof S]: boolean };

  protected readonly to: {
    [K in keyof S]: (...args: ParametersOmitFirst<S[K]['set']>) => boolean;
  };

  protected commit<K extends keyof S>(
    action: K,
    newState: this['state'] & ReturnType<S[K]['set']>
  ): boolean;
}

/**
 *
 * @param options
 * @param stateMachine
 * @ignore
 */
function generateStateGetters<S extends statesOptions>(
  options: S,
  stateMachine: StateContainer<any, any>
): { [K in keyof S]: boolean } {
  return Object.keys(options).reduce((result, state) => {
    Object.defineProperty(result, state, {
      get: () => !!options[state].is(stateMachine.state),
    });
    return result;
  }, {} as any);
}

/**
 *
 * @param options
 * @param stateMachine
 * @ignore
 */
function generateStateTransitions<S extends statesOptions>(
  options: S,
  stateMachine: StateContainer<any, any>
): { [K in keyof S]: (...args: ParametersOmitFirst<S[K]['set']>) => boolean } {
  return Object.keys(options).reduce((result, state) => {
    Object.defineProperty(result, state, {
      value: (...args) => {
        if (
          !options[state].from.some((from) =>
            options[from].is(stateMachine.state)
          )
        ) {
          return false;
        }

        return (stateMachine as any).commit(
          state,
          options[state].set(stateMachine.state, ...args)
        );
      },
    });
    return result;
  }, {} as any);
}

install({
  name: 'states',
  decoratorFactory: function states<
    S extends {
      [key: string]: {
        is: (state: any) => boolean;
        set: (state: any, ...args) => any;
        from: Array<keyof S>;
      };
    }
  >(options: S) {
    return (Base: StateContainerClass): Constructor => {
      return class extends Base {
        public readonly is = generateStateGetters(options, this);

        protected readonly to = generateStateTransitions(options, this);
      } as any;
    };
  },
});
