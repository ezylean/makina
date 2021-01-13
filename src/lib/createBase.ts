// tslint:disable:prefer-for-of max-classes-per-file variable-name
import { all as filterableAll, Filterables } from '@umoja/filterable';
import deepEqual from 'fast-deep-equal';
import { config } from './config';
import { CustomSignal } from './internal/CustomSignal';
import { memoizeOne } from './internal/utils';
import { Lens, lensProp, set, view } from './lenses';

export type MakinaModule = new (initialState: any, IO?: any) => any;

export interface Mapping<T> {
  [name: string]: T;
}

export declare class Base<
  State = {},
  IOs extends Mapping<any> = {},
  M extends Mapping<MakinaModule> = {}
> {
  protected IO: IOs & { [K in keyof M]: InstanceType<M[K]>['IO'] };

  public get state(): State & { [K in keyof M]: InstanceType<M[K]>['state'] };

  public onStateChange(
    listener: (
      state: State & { [K in keyof M]: InstanceType<M[K]>['state'] },
      action: string,
      target: Base<any, any, any>,
      currentTarget: Base<any, any, any>
    ) => void
  ): () => boolean;

  protected init(): void;

  protected commit(name: string, newState: State): void;

  protected create<
    V extends Base &
      (new (state: InstanceType<V>['state'], IO: InstanceType<V>['IO']) => any)
  >(
    lens: Lens<this['state'], InstanceType<V>['state']>,
    BaseClass: V,
    IO?: InstanceType<V>['IO']
  ): InstanceType<V>;

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
  initialState: State & { [K in keyof M]: InstanceType<M[K]>['state'] },
  IO?: IOs & { [K in keyof M]: InstanceType<M[K]>['IO'] }
) => Base<State, IOs, M> &
  {
    [K in keyof M]: InstanceType<M[K]> & Filterables<InstanceType<M[K]>>;
  };

export type createBase = <M extends Mapping<MakinaModule> = {}>(
  modules?: M
) => Base & BaseConstructor<M>;

export const createBase: createBase = modules => {
  // tslint:disable-next-line: no-shadowed-variable
  return class Base {
    // @ts-ignore
    private __IS_MAKINA = true;
    private _previousState;
    private _settedState;
    private _stateSource;
    private _stateGetter;
    private _stateSetter;
    private _broadcaster: CustomSignal<string, Base>;
    private _depth: number;
    private _stateChanged = new CustomSignal<any, string, Base, Base>();
    private _unsubscribe;

    public get state() {
      return this._stateSource
        ? this._stateGetter(this._stateSource.state)
        : this._settedState;
    }

    constructor(initialState: any = {}, protected IO = {}) {
      if (
        initialState &&
        initialState.source?.__IS_MAKINA &&
        typeof initialState.lens === 'function'
      ) {
        const { lens, source } = initialState;
        this._stateSource = source;
        this._stateGetter = memoizeOne(view(lens));
        this._stateSetter = set(lens);
        this._broadcaster = this._stateSource._broadcaster;
        this._depth = this._stateSource._depth + 1;
      } else {
        this._settedState = initialState;
        this._broadcaster = new CustomSignal();
        this._depth = 0;

        if (config.freeze) {
          this._settedState = config.freeze(this._settedState);
        }
      }

      this._previousState = this.state;

      Object.keys(modules || {}).forEach(name => {
        this[name] = this.create(
          lensProp<any, any>(name),
          modules[name],
          IO[name]
        );
      });

      this.init();
    }

    public onStateChange(listener) {
      if (this._stateSource) {
        if (!this._stateChanged.hasListeners()) {
          // listen state change from root
          this._unsubscribe = this._broadcaster.subscribe((action, target) => {
            if (!deepEqual(this._previousState, this.state)) {
              this._previousState = this.state;
              this._stateChanged.dispatch(this.state, action, target, this);
            }
          }, this._depth);
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
      return filterableAll(
        new BaseClass({ source: this, lens }, { ...this.IO, ...(IO || {}) }),
        true,
        false
      );
    }

    private updateState(newState, action, target) {
      if (this._stateSource) {
        this._stateSource.updateState(
          this._stateSetter(newState, this._stateSource.state),
          action,
          target
        );
      } else {
        this._settedState = newState;

        if (config.freeze) {
          this._settedState = config.freeze(this._settedState);
        }

        if (this._broadcaster.hasListeners()) {
          this._broadcaster.dispatch(action, target);
        }

        if (this._stateChanged.hasListeners()) {
          this._stateChanged.dispatch(this.state, action, target, this);
        }
      }
    }
  } as any;
};
