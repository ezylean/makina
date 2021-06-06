// tslint:disable:no-shadowed-variable max-classes-per-file
import { Base } from './Base';
import {
  hashGrid,
  memoizeOne,
  taskRunner,
  valuesEqual
} from './internal/utils';
import { splitLensProp } from './lenses';
import {
  Constructor,
  Mapping,
  StateMachineBase,
  StateMachineCtor
} from './types';

/**
 * create a state machine base class to be extended
 *
 * @param modules
 */
export function createBase<M extends Mapping<StateMachineCtor> = {}>(spec?: {
  modules?: M;
}): StateMachineBase<M, string>;
export function createBase<
  M extends Mapping<StateMachineCtor> = {},
  BaseState = {},
  S extends Mapping<(state: BaseState) => boolean> = {}
>(spec?: {
  modules?: M;
  states: S;
  transitions: { [K in keyof S]: Array<keyof S> };
}): StateMachineBase<M, keyof S> &
  Constructor<{
    is: { [K in keyof S]: boolean };
  }>;
export function createBase<
  M extends Mapping<StateMachineCtor> = {},
  BaseState = {},
  S extends Mapping<(state: BaseState) => boolean> = {}
>(
  spec:
    | {
        modules?: M;
        states: S;
        transitions: { [K in keyof S]: Array<keyof S> };
      }
    | { modules?: M } = {}
) {

  // modules
  let Extended = class extends Base<any, any, any> {
    constructor(initialState, IO = {}, options) {
      super(initialState, IO, options);

      const modules = spec?.modules;

      Object.keys(modules || {}).forEach(name => {
        this[name] = this.create(
          splitLensProp<any>(name),
          modules[name] as any,
          IO[name]
        );
      });

      this.ready = taskRunner.then(() => {
        return Promise.resolve(this.init()).then(() => this);
      });
    }
  } as any;
  
  // state machines
  if ('states' in spec && 'transitions' in spec) {
    const states = spec.states;
    const transitionGrid = hashGrid(spec.transitions);

    const stateNames = Object.keys(states).map(name =>
      isNaN(+name) ? name : +name
    );

    function match(state: BaseState): Array<keyof S> {
      return stateNames.filter(name => states[name](state)) as any;
    }

    const memoizedMatch = memoizeOne(match);

    function isAllowed(froms: Array<keyof S>, tos: Array<keyof S>) {
      return tos.every(to => froms.some(from => transitionGrid[from][to]));
    }

    const baseIs = stateNames.reduce((result, name) => {
      result[name] = false;
      return result;
    }, {});

    const memoizedIs = memoizeOne((state: BaseState) => {
      return memoizedMatch(state).reduce(
        (result, name) => {
          result[name] = true;
          return result;
        },
        { ...baseIs } as any
      );
    });

    Extended = class extends Extended {
      public get is() {
        return memoizedIs(this.state);
      }

      protected commit(action: keyof S | keyof S[], newState) {
        const froms = memoizedMatch(this.state);

        const actuals = match(newState).filter(
          state => froms.indexOf(state) === -1
        );

        const expecteds = (Array.isArray(action) ? action : [action]).filter(
          state => froms.indexOf(state) === -1
        );

        if (!valuesEqual(expecteds, actuals)) {
          throw new Error(
            `transition from "${froms}" is declared to "${expecteds}" but got "${actuals}"`
          );
        }

        if (isAllowed(froms, actuals)) {
          return super.commit(action, newState);
        }
        return false;
      }
    };
  }

  return Extended as any;
}
