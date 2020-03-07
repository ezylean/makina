// tslint:disable:no-expression-statement
import test from 'ava';
import { combineReducers } from './combineReducers';

test('simple', t => {
  const counter = (
    state: number = 0,
    action: { readonly type: 'INCREMENT' | 'DECREMENT' }
  ) => {
    switch (action.type) {
      case 'INCREMENT':
        return state + 1;
      case 'DECREMENT':
        return state - 1;
      default:
        return state;
    }
  };

  interface Todo {
    title: string;
  }

  const todos = (
    state: { readonly list: Todo[] } = { list: [] },
    action: { readonly type: 'ADD_TODOS'; data: Todo }
  ) => {
    switch (action.type) {
      case 'ADD_TODOS':
        return { ...state, list: [...state.list, action.data] };
      default:
        return state;
    }
  };

  const combined = combineReducers({
    counter,
    todos
  });

  t.deepEqual(combined(undefined, { type: 'INCREMENT' }), {
    counter: 1,
    todos: {
      list: []
    }
  });

  t.deepEqual(combined({ counter: 10 }, { type: 'INCREMENT' }), {
    counter: 11,
    todos: {
      list: []
    }
  });

  t.deepEqual(
    combined(
      { counter: -10 },
      { type: 'ADD_TODOS', data: { title: 'hello world' } }
    ),
    {
      counter: -10,
      todos: {
        list: [{ title: 'hello world' }]
      }
    }
  );
});
