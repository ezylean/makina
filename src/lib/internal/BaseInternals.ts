// tslint:disable:prefer-for-of variable-name

import { config } from '../config';
import { Base } from '../createBase';
import { CustomSignal } from './CustomSignal';

function isPrimitive(test) {
  return test !== Object(test);
}

export class BaseInternals<State> {
  public stateChanged = new CustomSignal();

  private _isComputedStateUpToDate = false;
  private computedState: State & {};
  private _submoduleUnsubscribes = [];

  constructor(
    private owner: any,
    private subModuleNames: string[],
    private settedState: State
  ) {}

  public get isComputedStateUpToDate() {
    return (
      this._isComputedStateUpToDate &&
      this.subModuleNames.every(
        name => this.owner[name].internals.isComputedStateUpToDate
      )
    );
  }

  public updateState(
    newState: State,
    action: string,
    target: Base<any, any, any>,
    currentTarget: Base<any, any, any>
  ) {
    this._isComputedStateUpToDate = false;
    this.settedState = newState;

    if (this.stateChanged.hasListeners()) {
      this.stateChanged.dispatch(
        this.getComputedState(),
        action,
        target,
        currentTarget
      );
    }
  }

  public onStateChange(listener) {
    if (!this.stateChanged.hasListeners()) {
      this._submoduleUnsubscribes = this.subModuleNames.map(name =>
        this.owner[name].internals.onStateChange((_, action, target) => {
          this.updateState(this.settedState, action, target, this.owner as any);
        })
      );
    }
    const unsuscribe = this.stateChanged.subscribe(listener);

    return () => {
      const result = unsuscribe();
      if (!this.stateChanged.hasListeners()) {
        this._submoduleUnsubscribes.forEach(submoduleUnsubscribe =>
          submoduleUnsubscribe()
        );
        this._submoduleUnsubscribes = [];
      }
      return result;
    };
  }

  public getComputedState() {
    if (!this.isComputedStateUpToDate) {
      this.computedState = isPrimitive(this.settedState)
        ? this.settedState
        : this.subModuleNames.reduce(
            (state, name) => {
              state[name] = this.owner[name].state;
              return state;
            },
            { ...this.settedState }
          );

      if (config.freeze) {
        this.computedState = config.freeze(this.computedState);
      }

      this._isComputedStateUpToDate = true;
    }

    return this.computedState;
  }
}
