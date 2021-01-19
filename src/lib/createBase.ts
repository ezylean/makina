// tslint:disable:prefer-for-of max-classes-per-file variable-name
import { all as filterableAll, Filterables } from '@umoja/filterable';
import { config } from './config';
import { CustomSignal } from './internal/CustomSignal';
import { memoizeOne, taskRunner } from './internal/utils';
import { Lens, lensProp, set, view } from './lenses';

export interface MakinaOptions {
  source: Base;
  lens: Lens<any, any>;
}

type MakinaModule = Base &
  (new (initialState: any, IO: any, options: MakinaOptions) => any);

export type StateMachine<T extends InstanceType<MakinaModule>> = T &
  Filterables<T>;

export interface Mapping<T> {
  [name: string]: T;
}

type Clean<T> = T extends infer U & {} ? U : T;

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type MayBeEmptyObjectKeys<T> = {
  [K in keyof T]-?: RequiredKeys<T[K]> extends never ? K : never;
}[keyof T];

type Optional<T extends object, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export type CombinedState<T extends object> = Optional<
  T,
  MayBeEmptyObjectKeys<T>
>;

type UnionToIntersection<U> = (U extends any
? (k: U) => void
: never) extends (k: infer I) => void
  ? I
  : never;
type PickAndFlatten<T, K extends keyof T> = UnionToIntersection<T[K]>;

export type CombinedIO<T extends object> = Partial<
  PickAndFlatten<T, keyof T> & { [K in keyof T]: Partial<T[K]> }
>;

export declare class Base<
  State = {},
  IOs extends Mapping<any> = {},
  M extends Mapping<MakinaModule> = {}
> {
  public get state(): Clean<
    State & { [K in keyof M]: InstanceType<M[K]>['state'] }
  >;

  public ready: Promise<this>;
  protected IO: Clean<IOs & { [K in keyof M]: InstanceType<M[K]>['IO'] }>;

  public onStateChange(
    listener: (
      state: Clean<State & { [K in keyof M]: InstanceType<M[K]>['state'] }>,
      action: string,
      target: Base<any, any, any>,
      currentTarget: Base<any, any, any>
    ) => void
  ): () => boolean;

  protected init(): void;

  protected commit(name: string, newState: State): void;

  protected create<
    V extends Base &
      (new (
        state: ConstructorParameters<V>[0],
        IO: ConstructorParameters<V>[1],
        options: MakinaOptions
      ) => InstanceType<V>)
  >(
    lens: Lens<this['state'], V['state']>,
    BaseClass: V,
    IO?: Partial<ConstructorParameters<V>[1]>
  ): StateMachine<InstanceType<V>>;

  private updateState(
    newState: State,
    action: string,
    target: Base<any, any, any>,
    currentTarget: Base<any, any, any>
  ): void;
}

export type BaseConstructor<M extends Mapping<MakinaModule>> = new <
  State = {},
  IOs extends Mapping<any> = {}
>(
  initialState: Clean<
    State & CombinedState<{ [K in keyof M]: ConstructorParameters<M[K]>[0] }>
  >,
  IO?: Clean<
    IOs & CombinedIO<{ [K in keyof M]: ConstructorParameters<M[K]>[1] }>
  >,
  options?: MakinaOptions
) => Base<State, IOs, M> &
  {
    [K in keyof M]: StateMachine<InstanceType<M[K]>>;
  };

export type createBase = <M extends Mapping<MakinaModule> = {}>(
  modules?: Partial<M>
) => Base & BaseConstructor<M>;

export const createBase: createBase = modules => {
  // tslint:disable-next-line: no-shadowed-variable
  return class Base {
    public get state() {
      return this._options.source
        ? this._options.getter(this._options.source.state)
        : this._state;
    }

    public ready: Promise<this>;
    private _state;
    private _options;
    private _stateChanged = new CustomSignal<any, string, Base, Base>();
    private _unsubscribe;

    constructor(initialState, protected IO = {}, options) {
      if (options && options.source && options.lens) {
        this._options = {
          broadcaster: options.source._options.broadcaster,
          depth: options.source._options.depth + 1,
          getter: memoizeOne(view(options.lens)),
          setter: set(options.lens),
          source: options.source
        };
      } else {
        this._options = {
          broadcaster: new CustomSignal(),
          depth: 0
        };
      }

      this._state = !config.freeze ? initialState : config.freeze(initialState);

      if (this._options.source && this.state !== this._state) {
        this.updateState(this._state, `new ${this.constructor.name}`, this);
      }

      Object.keys(modules || {}).forEach(name => {
        this[name] = this.create(
          lensProp<any, any>(name),
          modules[name],
          IO[name]
        );
      });

      this.ready = taskRunner.then(() => {
        this.init();
        return this;
      });
    }

    public onStateChange(listener) {
      if (this._options.source) {
        if (!this._stateChanged.hasListeners()) {
          // listen state change from root
          this._unsubscribe = this._options.broadcaster.subscribe(
            (action, target) => {
              if (this._state !== this.state) {
                this._state = this.state;
                this._stateChanged.dispatch(this.state, action, target, this);
              }
            },
            this._options.depth
          );
        }

        const unsuscribe = this._stateChanged.subscribe(listener);

        return () => {
          const result = unsuscribe();
          // disconnect from root
          if (this._unsubscribe && !this._stateChanged.hasListeners()) {
            this._unsubscribe();
            this._unsubscribe = null;
          }
          return result;
        };
      }

      return this._stateChanged.subscribe(listener);
    }

    protected init() {
      /* noop */
    }

    protected commit(action, newState) {
      if (newState !== this.state) {
        this.updateState(newState, action, this);
      }
    }

    protected create(lens, BaseClass, IO) {
      const instance = filterableAll(
        new BaseClass(
          view(lens, this.state),
          { ...this.IO, ...(IO || {}) },
          { source: this, lens }
        ),
        true,
        false
      );

      if (!instance._options.source) {
        throw new Error(
          `
          missing "options" parameter in constructor of "${BaseClass.name}"
          your constructor shoud look like this:

          constructor(initialState, IO, options) {
            super(initialState, IO, options)
          }
          `
        );
      }

      return instance;
    }

    private updateState(newState, action, target) {
      if (this._options.source) {
        this._options.source.updateState(
          this._options.setter(newState, this._options.source.state),
          action,
          target
        );
      } else {
        this._state = newState;

        if (config.freeze) {
          this._state = config.freeze(this._state);
        }

        if (this._options.broadcaster.hasListeners()) {
          this._options.broadcaster.dispatch(action, target);
        }

        if (this._stateChanged.hasListeners()) {
          this._stateChanged.dispatch(this.state, action, target, this);
        }
      }
    }
  } as any;
};
