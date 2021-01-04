// tslint:disable:prefer-for-of max-classes-per-file
import { all as filterableAll, Filterables } from '@umoja/filterable';
import { BaseInternals } from './internal/BaseInternals';

type MakinaModule = new (initialState: any, IO?: any) => any;

interface Mapping<T> {
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
      action: string
    ) => void
  ): void;

  protected init(): void;

  protected commit(name: string, newState: State): void;
}

type BaseConstructor<M extends Mapping<MakinaModule>> = new <
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
  const moduleNames = Object.keys(modules || {});

  // tslint:disable-next-line: no-shadowed-variable
  return class Base {
    private internals: BaseInternals<any>;

    constructor(initialState = {}, protected IO = {}) {
      for (let index = 0; index < moduleNames.length; index++) {
        const moduleName = moduleNames[index];
        this[moduleName] = filterableAll(
          new modules[moduleName](initialState[moduleName], {
            ...IO,
            ...(IO[moduleName] || {})
          })
        );
      }
      this.internals = new BaseInternals(this, moduleNames, initialState);

      this.init();
    }

    public get state() {
      return this.internals.getComputedState();
    }

    public onStateChange(listener) {
      return this.internals.onStateChange(listener);
    }

    protected init() {
      /* noop */
    }

    protected commit(name, newState) {
      const action = `${this.constructor.name}:${name}`;
      this.internals.updateState(newState, action);
    }
  } as any;
};
