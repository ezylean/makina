// tslint:disable:no-expression-statement
import test from 'ava';
import { mergeReducers } from './mergeReducers';

test('simple', t => {
  const counter = (
    state: { readonly counter: number } = { counter: 0 },
    action: { readonly type: 'INCREMENT' | 'DECREMENT' }
  ) => {
    switch (action.type) {
      case 'INCREMENT':
        return { ...state, counter: state.counter + 1 };
      case 'DECREMENT':
        return { ...state, counter: state.counter - 1 };
      default:
        return state;
    }
  };

  interface Todo {
    title: string;
  }

  const todos = (
    state: { readonly todos: Todo[] } = { todos: [] },
    action: { readonly type: 'ADD_TODOS'; data: Todo }
  ) => {
    switch (action.type) {
      case 'ADD_TODOS':
        return { ...state, todos: [...state.todos, action.data] };
      default:
        return state;
    }
  };

  const merged = mergeReducers(counter, todos);

  t.deepEqual(merged(undefined, { type: 'INCREMENT' }), {
    counter: 1,
    todos: []
  });

  t.deepEqual(merged({ counter: 10 }, { type: 'INCREMENT' }), {
    counter: 11,
    todos: []
  });

  t.deepEqual(
    merged(
      { counter: -10 },
      { type: 'ADD_TODOS', data: { title: 'hello world' } }
    ),
    {
      counter: -10,
      todos: [{ title: 'hello world' }]
    }
  );
});
