// tslint:disable:no-expression-statement object-literal-sort-keys
import test from 'ava';
import {
  combineSelectors,
  config,
  create,
  createBare,
  extendSelector,
  onActionTypes
} from './';

test('simple', t => {
  const factory = create({
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    }
  });

  const { dispatch, subscribe } = factory.create();

  const expected = [1, 2, 3, 4, 5, 4, 3, 2, 1, 0];

  subscribe(state => t.is(state, expected.shift()));

  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });

  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
});

test('simple no middleware', t => {
  const factory = createBare({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    }
  });

  const { dispatch, subscribe } = factory.create();

  const expected = [1, 2, 3, 4, 5, 4, 3, 2, 1, 0];

  subscribe(state => t.is(state, expected.shift()));

  dispatch.increment();
  dispatch.increment();
  dispatch.increment();
  dispatch.increment();
  dispatch.increment();

  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
});

test('use middleware', t => {
  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    }
  });

  factory.use(({ getState }) => (action, next) => {
    if (
      (action.type === 'INCREMENT' && getState() >= 2) ||
      (action.type === 'DECREMENT' && getState() <= -2)
    ) {
      return Promise.resolve(false);
    } else {
      return next();
    }
  });

  const { dispatch, subscribe } = factory.create();

  const expected = [1, 2, 1, 0, -1, -2];
  const result = [];

  subscribe(state => {
    result.push(state);
  });

  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });

  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });

  t.deepEqual(result, expected);
});

test('use middleware modifier', t => {
  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (state: number = 0, action) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    }
  });

  factory.use(
    onActionTypes(['INCREMENT'], ({ getState }) => (_, next) => {
      if (getState() >= 2) {
        return Promise.resolve(false);
      } else {
        return next();
      }
    })
  );

  const { dispatch, subscribe } = factory.create();

  const expected = [1, 2, 1, 0, -1, -2, -3, -4];
  const result = [];

  subscribe(state => {
    result.push(state);
  });

  dispatch.increment();
  dispatch.increment();
  dispatch.increment();
  dispatch.increment();
  dispatch.increment();

  dispatch.decrement();
  dispatch.decrement();
  dispatch.decrement();
  dispatch.decrement();
  dispatch.decrement();
  dispatch.decrement();

  t.deepEqual(result, expected);
});

test('throw in middleware', t => {
  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    }
  });

  factory.use(({ getState }) => (action, next) => {
    if (
      (action.type === 'INCREMENT' && getState() >= 2) ||
      (action.type === 'DECREMENT' && getState() <= -2)
    ) {
      throw new Error('not allowed');
    } else {
      return next();
    }
  });

  const { dispatch, subscribe } = factory.create();

  const expected = [1, 2, 1, 0, -1, -2];

  subscribe(state => t.is(state, expected.shift()));

  dispatch({ type: 'INCREMENT' }).catch(() => {
    throw new Error('should not be called');
  });
  dispatch({ type: 'INCREMENT' }).catch(() => {
    throw new Error('should not be called');
  });
  dispatch({ type: 'INCREMENT' }).catch(e => {
    t.deepEqual(e, new Error('not allowed'));
  });
  dispatch({ type: 'INCREMENT' }).catch(e => {
    t.deepEqual(e, new Error('not allowed'));
  });
  dispatch({ type: 'INCREMENT' }).catch(e => {
    t.deepEqual(e, new Error('not allowed'));
  });

  dispatch({ type: 'DECREMENT' }).catch(() => {
    throw new Error('should not be called');
  });
  dispatch({ type: 'DECREMENT' }).catch(() => {
    throw new Error('should not be called');
  });
  dispatch({ type: 'DECREMENT' }).catch(() => {
    throw new Error('should not be called');
  });
  dispatch({ type: 'DECREMENT' }).catch(() => {
    throw new Error('should not be called');
  });
  dispatch({ type: 'DECREMENT' }).catch(e => {
    t.deepEqual(e, new Error('not allowed'));
  });
});

test.serial('use config.freeze', t => {
  config.freeze = Object.freeze;

  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
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
    }
  });

  const { dispatch, subscribe } = factory.create();

  const expected = [1, 2, 3, 4, 5, 4, 3, 2, 1, 0];

  subscribe(state => {
    t.is(state.counter, expected.shift());
    t.true(Object.isFrozen(state));
  });

  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });

  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });

  config.freeze = null;
});

test('dispatch unknow action', t => {
  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    }
  });

  const { dispatch, subscribe } = factory.create();

  subscribe(() => {
    throw new Error('should not be called');
  });

  return dispatch({ type: 'UNKNOW' } as any).then(() => t.pass());
});

test('attach multiple listeners', t => {
  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    }
  });

  const { dispatch, subscribe } = factory.create();
  const expected1 = [1];
  const expected2 = [1];

  subscribe(state => t.is(state, expected1.shift()));
  subscribe(state => t.is(state, expected2.shift()));

  dispatch({ type: 'INCREMENT' });
});

test('detach multiple listeners', t => {
  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    }
  });

  const { dispatch, subscribe } = factory.create();

  const expected1 = [1, 2];
  const expected2 = [1, 2, 3, 4];

  const unsubscribe1 = subscribe(state => {
    t.is(state, expected1.shift());
    if (expected1.length === 0) {
      t.is(unsubscribe1(), true);
      t.is(unsubscribe1(), false);
    }
  });

  const unsubscribe2 = subscribe(state => {
    t.is(state, expected2.shift());
    if (expected2.length === 0) {
      t.is(unsubscribe2(), true);
      t.is(unsubscribe2(), false);
    }
  });

  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
});

test('detach multiple listeners at once', t => {
  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    }
  });

  const { dispatch, subscribe } = factory.create();

  const expected1 = [1, 2, 3, 4];
  const expected2 = [1, 2, 3, 4];

  let unsubscribe1;
  let unsubscribe2;

  unsubscribe1 = subscribe(state => {
    t.is(state, expected1.shift());
    if (expected1.length === 0) {
      t.is(unsubscribe1(), true);
      t.is(unsubscribe1(), false);
      t.is(unsubscribe2(), true);
      t.is(unsubscribe2(), false);
    }
  });

  unsubscribe2 = subscribe(state => {
    t.is(state, expected2.shift());
  });

  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
});

test('use scoped', t => {
  const factory = create(
    {
      actionCreators: {
        changeDescription: (description: string) => ({
          data: description,
          type: 'CHANGE_DESCRIPTION' as 'CHANGE_DESCRIPTION'
        }),
        decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
        increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
      },
      reducer: (
        state: { description: string; counter: number } = {
          counter: 0,
          description: 'just a counter'
        },
        action
      ) => {
        switch (action.type) {
          case 'INCREMENT':
            return { ...state, counter: state.counter + 1 };
          case 'DECREMENT':
            return { ...state, counter: state.counter - 1 };
          case 'CHANGE_DESCRIPTION':
            return { ...state, description: action.data };
          default:
            return state;
        }
      }
    },
    {},
    {
      counter: state => state.counter
    }
  );

  const { scopeds, getState } = factory.create();
  const scoped = scopeds.counter;

  t.deepEqual(getState(), { counter: 0, description: 'just a counter' });
  t.is(scoped.getState(), 0);

  scoped.dispatch({ type: 'INCREMENT' });
  scoped.dispatch({ type: 'INCREMENT' });
  scoped.dispatch({ type: 'UNKNOW' } as any);
  scoped.dispatch({ type: 'INCREMENT' });
  scoped.dispatch({ type: 'INCREMENT' });
  scoped.dispatch({ type: 'INCREMENT' });

  const expected = [4, 3, 2, 1, 0];
  scoped.subscribe(state => t.is(state, expected.shift()));

  t.is(scoped.getState(), 5);
  t.deepEqual(getState(), { counter: 5, description: 'just a counter' });

  scoped.dispatch({ type: 'DECREMENT' });
  scoped.dispatch({ type: 'DECREMENT' });
  scoped.dispatch({ type: 'DECREMENT' });
  scoped.dispatch({ type: 'DECREMENT' });
  scoped.dispatch({ type: 'DECREMENT' });

  t.deepEqual(getState(), { counter: 0, description: 'just a counter' });
  t.is(scoped.getState(), 0);

  scoped.dispatch({ type: 'CHANGE_DESCRIPTION', data: 'my awesome counter' });

  t.is(scoped.getState(), 0);
  t.deepEqual(getState(), { counter: 0, description: 'my awesome counter' });
});

test.serial('use scoped with config.freeze', t => {
  config.freeze = Object.freeze;

  const factory = create(
    {
      actionCreators: {
        changeDescription: (description: string) => ({
          data: description,
          type: 'CHANGE_DESCRIPTION' as 'CHANGE_DESCRIPTION'
        }),
        decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
        increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
      },
      reducer: (
        state: { description: string; counter: number } = {
          counter: 0,
          description: 'just a counter'
        },
        action:
          | { type: 'INCREMENT' | 'DECREMENT' }
          | { type: 'CHANGE_DESCRIPTION'; data: string }
      ) => {
        switch (action.type) {
          case 'INCREMENT':
            return { ...state, counter: state.counter + 1 };
          case 'DECREMENT':
            return { ...state, counter: state.counter - 1 };
          case 'CHANGE_DESCRIPTION':
            return { ...state, description: action.data };
          default:
            return state;
        }
      }
    },
    {},
    {
      derived_counter: combineSelectors({ derived: s => s.counter })
    }
  );

  const { scopeds, getState } = factory.create();
  const scoped = scopeds.derived_counter;

  t.deepEqual(getState(), { counter: 0, description: 'just a counter' });
  t.deepEqual(scoped.getState(), { derived: 0 });

  scoped.dispatch({ type: 'INCREMENT' });
  scoped.dispatch({ type: 'INCREMENT' });
  scoped.dispatch({ type: 'UNKNOW' } as any);
  scoped.dispatch({ type: 'INCREMENT' });
  scoped.dispatch({ type: 'INCREMENT' });
  scoped.dispatch({ type: 'INCREMENT' });

  const expected = [
    { derived: 4 },
    { derived: 3 },
    { derived: 2 },
    { derived: 1 },
    { derived: 0 }
  ];
  scoped.subscribe(state => t.deepEqual(state, expected.shift()));

  t.deepEqual(scoped.getState(), { derived: 5 });
  t.deepEqual(getState(), { counter: 5, description: 'just a counter' });

  scoped.dispatch({ type: 'DECREMENT' });
  scoped.dispatch({ type: 'DECREMENT' });
  scoped.dispatch({ type: 'DECREMENT' });
  scoped.dispatch({ type: 'DECREMENT' });
  scoped.dispatch({ type: 'DECREMENT' });

  t.deepEqual(getState(), { counter: 0, description: 'just a counter' });
  t.deepEqual(scoped.getState(), { derived: 0 });

  scoped.dispatch({ type: 'CHANGE_DESCRIPTION', data: 'my awesome counter' });

  t.deepEqual(scoped.getState(), { derived: 0 });
  t.deepEqual(getState(), { counter: 0, description: 'my awesome counter' });
  config.freeze = null;
});

test('use scoped in scoped', t => {
  const factory = create(
    {
      actionCreators: {
        changeDescription: (description: string) => ({
          data: description,
          type: 'CHANGE_DESCRIPTION' as 'CHANGE_DESCRIPTION'
        }),
        decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
        increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
      },
      reducer: (
        state: { subState: { description: string; counter: number } } = {
          subState: {
            counter: 0,
            description: 'just a counter'
          }
        },
        action:
          | { type: 'INCREMENT' | 'DECREMENT' }
          | { type: 'CHANGE_DESCRIPTION'; data: string }
      ) => {
        switch (action.type) {
          case 'INCREMENT':
            return {
              ...state,
              subState: {
                ...state.subState,
                counter: state.subState.counter + 1
              }
            };
          case 'DECREMENT':
            return {
              ...state,
              subState: {
                ...state.subState,
                counter: state.subState.counter - 1
              }
            };
          case 'CHANGE_DESCRIPTION':
            return {
              ...state,
              subState: { ...state.subState, description: action.data }
            };
          default:
            return state;
        }
      }
    },
    {},
    {
      subState: extendSelector(state => state.subState, {
        counter: state => state.counter
      })
    }
  );

  const factoryInstance = factory.create();
  const subStatefactory = factoryInstance.scopeds.subState;
  const counterfactory = subStatefactory.scopeds.counter;

  t.deepEqual(subStatefactory.getState(), {
    counter: 0,
    description: 'just a counter'
  });
  t.is(counterfactory.getState(), 0);

  counterfactory.dispatch({ type: 'INCREMENT' });
  subStatefactory.dispatch({ type: 'INCREMENT' });
  factoryInstance.dispatch({ type: 'UNKNOW' } as any);
  subStatefactory.dispatch({ type: 'INCREMENT' });
  counterfactory.dispatch({ type: 'INCREMENT' });
  factoryInstance.dispatch({ type: 'INCREMENT' });

  const expected = [4, 3, 2, 1, 0];
  counterfactory.subscribe(state => t.is(state, expected.shift()));

  t.is(counterfactory.getState(), 5);
  t.deepEqual(subStatefactory.getState(), {
    counter: 5,
    description: 'just a counter'
  });

  counterfactory.dispatch({ type: 'DECREMENT' });
  counterfactory.dispatch({ type: 'DECREMENT' });
  counterfactory.dispatch({ type: 'DECREMENT' });
  counterfactory.dispatch({ type: 'DECREMENT' });
  counterfactory.dispatch({ type: 'DECREMENT' });

  t.deepEqual(subStatefactory.getState(), {
    counter: 0,
    description: 'just a counter'
  });
  t.is(counterfactory.getState(), 0);

  factoryInstance.dispatch({
    data: 'my awesome counter',
    type: 'CHANGE_DESCRIPTION'
  });

  t.is(counterfactory.getState(), 0);
  t.deepEqual(subStatefactory.getState(), {
    counter: 0,
    description: 'my awesome counter'
  });
});

test('invalid selector', t => {
  const error = t.throws(
    () => {
      const factory = create(
        {
          actionCreators: {
            changeDescription: (description: string) => ({
              data: description,
              type: 'CHANGE_DESCRIPTION' as 'CHANGE_DESCRIPTION'
            }),
            decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
            increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
          },
          reducer: (
            state: { description: string; counter: number } = {
              counter: 0,
              description: 'just a counter'
            },
            action:
              | { type: 'INCREMENT' | 'DECREMENT' }
              | { type: 'CHANGE_DESCRIPTION'; data: string }
          ) => {
            switch (action.type) {
              case 'INCREMENT':
                return { ...state, counter: state.counter + 1 };
              case 'DECREMENT':
                return { ...state, counter: state.counter - 1 };
              case 'CHANGE_DESCRIPTION':
                return { ...state, description: action.data };
              default:
                return state;
            }
          }
        },
        {},
        {
          derived_counter: ({ counter }) => ({ derived: counter })
        }
      );

      factory.create();
    },
    { instanceOf: Error }
  );

  t.is(
    error.message,
    `
      the selector derived_counter return non-stricly equal values for the same subsequent input,
      consider using 'mergeSelectors' or 'combineSelectors'.
    `
  );
});

test('use middleware in module', t => {
  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    },
    middlewares: [
      ({ getState }) => (action, next) => {
        if (
          (action.type === 'INCREMENT' && getState() >= 2) ||
          (action.type === 'DECREMENT' && getState() <= -2)
        ) {
          return Promise.resolve(false);
        } else {
          return next();
        }
      }
    ]
  });

  const { dispatch, subscribe } = factory.create();

  const expected = [1, 2, 1, 0, -1, -2];
  const result = [];

  subscribe(state => {
    result.push(state);
  });

  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });

  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });

  t.deepEqual(result, expected);
});

test('replace module', t => {
  const factory = create({
    actionCreators: {
      decrement: () => ({ type: 'DECREMENT' as 'DECREMENT' }),
      increment: () => ({ type: 'INCREMENT' as 'INCREMENT' })
    },
    reducer: (
      state: number = 0,
      action: { type: 'INCREMENT' | 'DECREMENT' }
    ) => {
      switch (action.type) {
        case 'INCREMENT':
          return state + 1;
        case 'DECREMENT':
          return state - 1;
        default:
          return state;
      }
    },
    middlewares: [
      ({ getState }) => (action, next) => {
        if (
          (action.type === 'INCREMENT' && getState() >= 2) ||
          (action.type === 'DECREMENT' && getState() <= -2)
        ) {
          return Promise.resolve(false);
        } else {
          return next();
        }
      }
    ]
  });

  const { dispatch, subscribe, getState } = factory.create();

  const expected = [1, 2, 1, 0, -1, -2];
  const result = [];

  const unsubscribe = subscribe(state => {
    result.push(state);
  });

  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'INCREMENT' });

  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });
  dispatch({ type: 'DECREMENT' });

  t.deepEqual(result, expected);

  unsubscribe();

  factory.replaceModule({
    actionCreators: {
      plus: (value: number) => ({
        type: 'PLUS' as 'PLUS',
        value
      })
    },
    reducer: (state: number = 0, action: { type: 'PLUS'; value: number }) => {
      switch (action.type) {
        case 'PLUS':
          return state + action.value;
        default:
          return state;
      }
    },
    middlewares: [
      () => (action, next) => {
        if (action.type === 'PLUS') {
          action.value *= 2;
        }
        return next();
      }
    ]
  });

  //@ts-ignore
  t.is(typeof dispatch.plus, 'function');
  //@ts-ignore
  dispatch.plus(10);
  t.is(getState(), -2 + 10 * 2);

  factory.replaceModule({
    reducer: (state: number = 0, action: { type: 'PLUS'; value: number }) => {
      switch (action.type) {
        case 'PLUS':
          return state + action.value;
        default:
          return state;
      }
    }
  });

  //@ts-ignore
  t.is(typeof dispatch.plus, 'undefined');
  //@ts-ignore
  dispatch({ type: 'PLUS', value: 10 });
  t.is(getState(), 18 + 10);
});
