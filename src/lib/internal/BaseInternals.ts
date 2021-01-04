// tslint:disable:prefer-for-of

import { config } from '../config';
import { CustomSignal } from './CustomSignal';

function isPrimitive(test) {
  return test !== Object(test);
}

export class BaseInternals<State> {
  public stateChanged = new CustomSignal();

  // tslint:disable-next-line
  private _isComputedStateUpToDate = false;
  private computedState: State & {};

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

  public updateState(newState: State, action: string) {
    this._isComputedStateUpToDate = false;
    this.settedState = newState;

    if (this.stateChanged.hasListeners()) {
      this.stateChanged.dispatch(this.getComputedState(), action);
    }
  }

  public onStateChange(listener) {
    return this.stateChanged.subscribe(listener);
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
