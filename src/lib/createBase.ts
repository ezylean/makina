// tslint:disable:no-shadowed-variable
import { Base } from './Base';
import { taskRunner } from './internal/utils';
import { splitLensProp } from './lenses';
import {
  FullIO,
  FullState,
  Mapping,
  Options,
  StateMachineBase,
  StateMachineCtor
} from './types';

/**
 * create a state machine base class to be extended
 *
 * @param modules
 */
export function createBase<M extends Mapping<StateMachineCtor> = {}>(
  modules?: M
): StateMachineBase<M> {
  return class<State = {}, IO extends Mapping = {}> extends Base<
    FullState<State, M>,
    FullIO<IO, M>
  > {
    constructor(
      initialState: FullState<State, M>,
      IO: FullIO<IO, M> = {} as any,
      options?: Options
    ) {
      super(initialState, IO, options);

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
}
