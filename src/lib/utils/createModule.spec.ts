// tslint:disable:no-expression-statement
import test from 'ava';
import { createModule } from './createModule';

test('simple', t => {
  const INCREMENT = 'INCREMENT' as 'INCREMENT';
  const DECREMENT = 'DECREMENT' as 'DECREMENT';

  const mod = createModule({
    actions: {
      decrement: {
        type: DECREMENT
      },
      increment: {
        creator: (val: number) => ({ type: INCREMENT, val }),
        type: INCREMENT
      }
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

  t.deepEqual(mod.actionCreators.increment(5), { type: INCREMENT, val: 5 });
  t.deepEqual(mod.actionCreators.decrement(), { type: DECREMENT });

  t.is(mod.reducer(5, { type: DECREMENT }), 4);

  t.deepEqual(mod.middlewares, []);
});

test('simple with middlewares', t => {
  const INCREMENT = 'INCREMENT' as 'INCREMENT';
  const DECREMENT = 'DECREMENT' as 'DECREMENT';

  const calls = [];

  const mod = createModule({
    actions: {
      decrement: {
        middlewares: [
          _ => (action, next) => {
            calls.push(`action middleware: ${action.type}`);
            return next();
          }
        ],
        type: DECREMENT
      },
      increment: {
        middlewares: [
          _ => (action, next) => {
            calls.push(`action middleware: ${action.type}`);
            return next();
          }
        ],
        type: INCREMENT
      }
    },
    middlewares: [
      _ => (action, next) => {
        calls.push(`module middleware: ${action.type}`);
        return next();
      }
    ],
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

  t.deepEqual(mod.actionCreators.increment(), { type: INCREMENT });
  t.deepEqual(mod.actionCreators.decrement(), { type: DECREMENT });

  t.is(mod.reducer(5, { type: INCREMENT }), 6);

  t.deepEqual(mod.middlewares.length, 3);

  // module Middleware called
  return (
    mod.middlewares[0]({} as any)({ type: INCREMENT }, () =>
      Promise.resolve(true)
    )
      .then(() => {
        t.deepEqual(calls, [`module middleware: INCREMENT`]);
      })
      // action DECREMENT Middleware not called
      .then(() => {
        return mod.middlewares[1]({} as any)({ type: INCREMENT }, () =>
          Promise.resolve(true)
        );
      })
      .then(() => {
        t.deepEqual(calls, [`module middleware: INCREMENT`]);
      })
      // action INCREMENT Middleware called
      .then(() => {
        return mod.middlewares[2]({} as any)({ type: INCREMENT }, () =>
          Promise.resolve(true)
        );
      })
      .then(() => {
        t.deepEqual(calls, [
          `module middleware: INCREMENT`,
          `action middleware: INCREMENT`
        ]);
      })
  );
});

test('super', t => {
  const INCREMENT_1 = 'INCREMENT_1' as 'INCREMENT_1';
  const DECREMENT_1 = 'DECREMENT_1' as 'DECREMENT_1';

  const INCREMENT_2 = 'INCREMENT_2' as 'INCREMENT_2';
  const DECREMENT_2 = 'DECREMENT_2' as 'DECREMENT_2';

  const mod = createModule({
    modules: {
      counter1: createModule({
        actions: {
          decrement1: { type: DECREMENT_1 },
          increment1: { type: INCREMENT_1 }
        },
        reducer: (state: number = 0, action) => {
          switch (action.type) {
            case INCREMENT_1:
              return state + 1;
            case DECREMENT_1:
              return state - 1;
            default:
              return state;
          }
        }
      }),
      counter2: createModule({
        actions: {
          decrement2: { type: DECREMENT_2 },
          increment2: { type: INCREMENT_2 }
        },
        reducer: (state: number = 0, action) => {
          switch (action.type) {
            case INCREMENT_2:
              return state + 1;
            case DECREMENT_2:
              return state - 1;
            default:
              return state;
          }
        }
      })
    }
  });

  t.deepEqual(mod.actionCreators.increment1(), { type: INCREMENT_1 });
  t.deepEqual(mod.actionCreators.decrement2(), { type: DECREMENT_2 });

  t.deepEqual(
    mod.reducer({ counter1: 5, counter2: 10 }, { type: DECREMENT_2 }),
    {
      counter1: 5,
      counter2: 9
    }
  );

  t.deepEqual(mod.reducer({ counter2: 10 }, { type: INCREMENT_1 }), {
    counter1: 1,
    counter2: 10
  });

  t.deepEqual(mod.middlewares, []);
});

test('super with middlewares', t => {
  const INCREMENT_1 = 'INCREMENT_1' as 'INCREMENT_1';
  const DECREMENT_1 = 'DECREMENT_1' as 'DECREMENT_1';

  const INCREMENT_2 = 'INCREMENT_2' as 'INCREMENT_2';
  const DECREMENT_2 = 'DECREMENT_2' as 'DECREMENT_2';

  const calls = [];

  const mod = createModule({
    modules: {
      counter1: createModule({
        actions: {
          decrement1: {
            middlewares: [
              _ => (action, next) => {
                calls.push(`action middleware: ${action.type}`);
                return next();
              }
            ],
            type: DECREMENT_1
          },
          increment1: {
            middlewares: [
              (io: any) => (action, next) => {
                calls.push(`action middleware: ${action.type}`);
                t.is(typeof io.getState(), 'number');
                return next();
              }
            ],
            type: INCREMENT_1
          }
        },
        middlewares: [
          (io: any) => (action, next) => {
            calls.push(`module 1 middleware: ${action.type}`);
            t.is(typeof io.getState(), 'number');
            return next();
          }
        ],
        reducer: (state: number = 0, action) => {
          switch (action.type) {
            case INCREMENT_1:
              return state + 1;
            case DECREMENT_1:
              return state - 1;
            default:
              return state;
          }
        }
      }),
      counter2: createModule({
        actions: {
          decrement2: {
            middlewares: [
              _ => (action, next) => {
                calls.push(`action middleware: ${action.type}`);
                return next();
              }
            ],
            type: DECREMENT_2
          },
          increment2: {
            middlewares: [
              _ => (action, next) => {
                calls.push(`action middleware: ${action.type}`);
                return next();
              }
            ],
            type: INCREMENT_2
          }
        },
        middlewares: [
          _ => (action, next) => {
            calls.push(`module 2 middleware: ${action.type}`);
            return next();
          }
        ],
        reducer: (state: number = 0, action) => {
          switch (action.type) {
            case INCREMENT_2:
              return state + 1;
            case DECREMENT_2:
              return state - 1;
            default:
              return state;
          }
        }
      })
    }
  });

  t.deepEqual(mod.actionCreators.increment1(), { type: INCREMENT_1 });
  t.deepEqual(mod.actionCreators.decrement2(), { type: DECREMENT_2 });

  t.deepEqual(
    mod.reducer({ counter1: 5, counter2: 10 }, { type: DECREMENT_2 }),
    {
      counter1: 5,
      counter2: 9
    }
  );

  t.deepEqual(mod.reducer({ counter2: 10 }, { type: INCREMENT_1 }), {
    counter1: 1,
    counter2: 10
  });

  t.deepEqual(mod.middlewares.length, 6);

  // module 1 Middleware called
  return (
    mod.middlewares[0]({
      getState: () => ({ counter1: 0, counter2: 0 })
    } as any)({ type: INCREMENT_1 }, () => Promise.resolve(true))
      .then(() => {
        t.deepEqual(calls, [`module 1 middleware: INCREMENT_1`]);
      })
      // action DECREMENT_1 Middleware not called
      .then(() => {
        return mod.middlewares[1]({
          getState: () => ({ counter1: 0, counter2: 0 })
        } as any)({ type: INCREMENT_1 }, () => Promise.resolve(true));
      })
      .then(() => {
        t.deepEqual(calls, [`module 1 middleware: INCREMENT_1`]);
      })
      // action INCREMENT_1 Middleware called
      .then(() => {
        return mod.middlewares[2]({
          getState: () => ({ counter1: 0, counter2: 0 })
        } as any)({ type: INCREMENT_1 }, () => Promise.resolve(true));
      })
      .then(() => {
        t.deepEqual(calls, [
          `module 1 middleware: INCREMENT_1`,
          `action middleware: INCREMENT_1`
        ]);
      })
      // other middleware not called
      .then(() => {
        return mod.middlewares[3]({
          getState: () => ({ counter1: 0, counter2: 0 })
        } as any)({ type: INCREMENT_1 }, () => Promise.resolve(true));
      })
      .then(() => {
        t.deepEqual(calls, [
          `module 1 middleware: INCREMENT_1`,
          `action middleware: INCREMENT_1`
        ]);
      })
      // other middleware not called
      .then(() => {
        return mod.middlewares[4]({
          getState: () => ({ counter1: 0, counter2: 0 })
        } as any)({ type: INCREMENT_1 }, () => Promise.resolve(true));
      })
      .then(() => {
        t.deepEqual(calls, [
          `module 1 middleware: INCREMENT_1`,
          `action middleware: INCREMENT_1`
        ]);
      })
      // other middleware not called
      .then(() => {
        return mod.middlewares[5]({
          getState: () => ({ counter1: 0, counter2: 0 })
        } as any)({ type: INCREMENT_1 }, () => Promise.resolve(true));
      })
      .then(() => {
        t.deepEqual(calls, [
          `module 1 middleware: INCREMENT_1`,
          `action middleware: INCREMENT_1`
        ]);
      })
  );
});

test('full with middlewares', t => {
  const CHANGE_NAME = 'CHANGE_NAME' as 'CHANGE_NAME';
  const INCREMENT = 'INCREMENT' as 'INCREMENT';
  const DECREMENT = 'DECREMENT' as 'DECREMENT';

  const calls = [];

  const mod = createModule({
    actions: {
      changeName: {
        type: CHANGE_NAME,
        creator: (name: string) => ({ type: CHANGE_NAME, name })
      }
    },
    reducer: (state: { name?: string } = {}, action) => {
      switch (action.type) {
        case CHANGE_NAME:
          return { ...state, name: action.name as string };
        default:
          return state;
      }
    },
    middlewares: [
      _ => (action, next) => {
        calls.push(`main module middleware: ${action.type}`);
        return next();
      }
    ],
    modules: {
      counter: createModule({
        actions: {
          decrement: {
            middlewares: [
              _ => (action, next) => {
                calls.push(`action middleware: ${action.type}`);
                return next();
              }
            ],
            type: DECREMENT
          },
          increment: {
            middlewares: [
              _ => (action, next) => {
                calls.push(`action middleware: ${action.type}`);
                return next();
              }
            ],
            type: INCREMENT
          }
        },
        middlewares: [
          _ => (action, next) => {
            calls.push(`counter module middleware: ${action.type}`);
            return next();
          }
        ],
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
      })
    }
  });

  t.deepEqual(mod.actionCreators.increment(), { type: INCREMENT });
  t.deepEqual(mod.actionCreators.decrement(), { type: DECREMENT });

  t.deepEqual(mod.reducer({}, { type: INCREMENT }), { counter: 1 });
  t.deepEqual(mod.reducer({}, { type: CHANGE_NAME, name: 'momo' }), {
    name: 'momo',
    counter: 0
  });

  t.deepEqual(mod.middlewares.length, 4);

  // main module Middleware called
  return (
    mod.middlewares[0]({} as any)({ type: INCREMENT }, () =>
      Promise.resolve(true)
    )
      .then(() => {
        t.deepEqual(calls, [`main module middleware: INCREMENT`]);
      })
      // module middleware Middleware called
      .then(() => {
        return mod.middlewares[1]({} as any)({ type: INCREMENT }, () =>
          Promise.resolve(true)
        );
      })
      .then(() => {
        t.deepEqual(calls, [
          `main module middleware: INCREMENT`,
          `counter module middleware: INCREMENT`
        ]);
      })
      // action DECREMENT Middleware not called
      .then(() => {
        return mod.middlewares[2]({} as any)({ type: INCREMENT }, () =>
          Promise.resolve(true)
        );
      })
      .then(() => {
        t.deepEqual(calls, [
          `main module middleware: INCREMENT`,
          `counter module middleware: INCREMENT`
        ]);
      })
      // action INCREMENT Middleware called
      .then(() => {
        return mod.middlewares[3]({} as any)({ type: INCREMENT }, () =>
          Promise.resolve(true)
        );
      })
      .then(() => {
        t.deepEqual(calls, [
          `main module middleware: INCREMENT`,
          `counter module middleware: INCREMENT`,
          'action middleware: INCREMENT'
        ]);
      })
  );
});
