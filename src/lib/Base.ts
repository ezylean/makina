// tslint:disable:variable-name no-shadowed-variable

import { all as filterableAll, Filterables } from '@umoja/filterable';
import { config } from './config';
import { CustomSignal } from './internal/CustomSignal';
import { memoizeOne } from './internal/utils';
import { Lens, lensToSplitLens, SplitLens, splitLensProp } from './lenses';
import {
  LeafOptions,
  Options,
  RootOptions,
  StateMachine,
  StateMachineCtor,
} from './types';

/**
 * @ignore
 */
export class Base<State, IO, S> {
  /**
   * state machine factory
   *
   * @param initialState
   * @param IO
   * @param options
   */
  public static create<T extends StateMachineCtor>(
    this: T,
    ...[initialState, IO, options]: ConstructorParameters<T>
  ) {
    return filterableAll(
      new this(initialState, IO, options),
      false
    ) as Filterables<InstanceType<T>>;
  }

  /**
   * current state
   */
  public get state(): State {
    return 'getter' in this._options
      ? this._options.getter(this._options.source.state)
      : this._state;
  }

  /**
   * resolve when the state machine has been initialised
   */
  public ready: Promise<this>;
  private _state?: State;
  private _options: RootOptions<S> | LeafOptions<State, S>;
  private _stateChanged = new CustomSignal<
    State,
    S | S[],
    StateMachine,
    StateMachine
  >();
  private _unsubscribe?: () => void;

  /**
   * state machine constructor
   *
   * @param initialState
   * @param IO
   * @param options
   */
  constructor(
    initialState: State,
    protected IO: IO = {} as any,
    options?: Options
  ) {
    if (options && options && options.lens) {
      const splitLens = lensToSplitLens(options.lens);

      this._options = {
        broadcaster: options.source._options.broadcaster,
        depth: options.source._options.depth + 1,
        getter: memoizeOne(splitLens.get),
        setter: splitLens.set,
        source: options.source,
      };
    } else {
      this._options = {
        broadcaster: new CustomSignal(),
        depth: 0,
      };
    }

    this._state = !config.freeze ? initialState : config.freeze(initialState);

    if ('source' in this._options && this.state !== this._state) {
      this._updateState(
        this._state,
        `new ${this.constructor.name}` as any,
        this
      );
    }
  }

  /**
   * listen to state changes
   *
   * @param listener
   *
   * @return removeListener function
   */
  public onStateChange(
    listener: (
      state: State,
      action: S | S[],
      target: StateMachine,
      source: StateMachine
    ) => void
  ) {
    if ('source' in this._options) {
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

  /**
   * implement to perform actions before the state machine is declared ready
   */
  protected init(): void | Promise<void> {
    /* noop */
  }

  /**
   * update the state machine state
   *
   * @param action
   * @param newState
   */
  protected commit(action: S | S[], newState: State) {
    if (newState !== this.state) {
      this._updateState(newState, action, this);
      return true;
    }
    return false;
  }

  /**
   * create sub state machine targeting a part of the state of the current state machine
   *
   * @param lens
   * @param ModuleClass
   * @param IO
   */
  protected create<
    T extends { create: typeof Base['create'] } & StateMachineCtor
  >(
    lens:
      | keyof this['state']
      | Lens<this['state'], InstanceType<T>['state']>
      | SplitLens<this['state'], InstanceType<T>['state']>,
    ModuleClass: T,
    IO?: Partial<ConstructorParameters<T>[1]>
  ): Filterables<InstanceType<T>> {
    const splitLens =
      typeof lens === 'string' || typeof lens === 'number'
        ? splitLensProp<this['state']>(lens)
        : lensToSplitLens(
            lens as Lens<this['state'], InstanceType<T>['state']>
          );

    const instance = ModuleClass.create<any>(
      splitLens.get(this.state),
      { ...this.IO, ...(IO || {}) },
      { source: this, lens: splitLens }
    );

    if (!(instance._options as LeafOptions<any, any>).source) {
      throw new Error(
        `
        missing "options" parameter in constructor of "${ModuleClass.name}"
        your constructor shoud look like this:

        constructor(initialState, IO, options) {
          super(initialState, IO, options)
        }
        `
      );
    }

    return instance;
  }

  private _updateState(newState: State, action: S | S[], target: StateMachine) {
    if ('source' in this._options) {
      this._options.source._updateState(
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
}
