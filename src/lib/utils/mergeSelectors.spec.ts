// tslint:disable:no-expression-statement
import test from 'ava';
import { mergeSelectors } from './mergeSelectors';

test('simple', t => {
  interface State {
    list1: string[];
    list2: any[];
    list3: number[];
  }

  const selector = mergeSelectors(
    [(s: State) => s.list1, (s: State) => s.list3],
    ([list1, list3]) => ({ list1, list3 })
  );

  const state = {
    list1: [],
    list2: [],
    list3: []
  };

  const state2 = {
    list1: state.list1,
    list2: ['changed'],
    list3: state.list3
  };

  t.is(selector(state), selector(state2));
  t.is(selector(state2), selector(state2));
  t.deepEqual(selector(state), {
    list1: state.list1,
    list3: state.list3
  });
  t.deepEqual(selector(state2), {
    list1: state.list1,
    list3: state.list3
  });
});
