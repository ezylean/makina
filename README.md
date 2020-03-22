<p align="center">
  <br/>
  <br/>
  <img src="https://raw.githubusercontent.com/ezylean/makina/master/logo.png" alt="Makina" width="200px"/>
  <br/>
  <br/>
</p>

<p align="center">create a backend in your frontend</p>

## Why

Writing frontend application is a mess.

Redux help a lot but has adopted a modular and unopinionated approach which give flexibility at the cost
of having to manage a lot of related code everywhere.

While keeping the same principles at his core Makina take the opposite approach to create a all-in-one express-like backend for your frontend.

Think of it as a fusion of express and redux.

## Mental model

In Makina you should think of your frontend application as a complete stack, with your UI (React, Vue, Angular, etc...) as the frontend part and a StateMachine as a backend.

the whole application logic, I/O and state management of your application will be managed in the StateMachine while the UI will be responsible for presentational logic, displaying the current state and dispatch actions.

## Getting Started

### Installation

```shell
  npm i @ezy/makina
```

### Counter example

index.js

```js
import { create } from '@ezy/makina';

const INCREMENT = 'INCREMENT'; // as 'INCREMENT'
const DECREMENT = 'DECREMENT'; // as 'DECREMENT'

const factory = create(
  {
    actionCreators: {
      increment: () => ({ type: INCREMENT }),
      decrement: () => ({ type: DECREMENT })
    },
    reducer: (state = 0, action) => {
      switch (action.type) {
        case INCREMENT:
          return state + 1;
        case DECREMENT:
          return state - 1;
        default:
          return state;
      }
    }
  },
  {
    log: console.log
  }
);

// use a middleware
factory.use(io => (action, next) => {
  io.log(action.type);
  return next();
});

const stateMachine = factory.create();

// UI bindings
document
  .getElementById('increment')
  .addEventListener('click', stateMachine.dispatch.increment);
document
  .getElementById('decrement')
  .addEventListener('click', stateMachine.dispatch.decrement);

const render = () => {
  document.getElementById('result').textContent = stateMachine.getState();
};

stateMachine.subscribe(render);
render();
```

index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Counter</title>
  </head>
  <body>
    <div id="app">
      <div id="result"></div>
      <button id="increment">+</button>
      <button id="decrement">-</button>
    </div>
    <script src="index.js"></script>
  </body>
</html>
```

## immutable state guarantee

Makina provide a way to ensure your application state is never mutated.
set in the config object a freeze function to deep freeze your state when a new state is created.
Deep freezing objects can be costly from a performance standpoint, it's recommended to disable it in production.

### Example

```js
import { config } from '@ezy/makina';
// immutable state in all environnments except production
config.freeze =
  process.env.NODE_ENV !== 'production' ? require('deep-freeze-strict') : null;
```

## Building complex app

The create function exposed by the library have the following signature:

```js
create(module, defaultIO, selectors) => StateMachineFactory
```

### module

a module is a plain javascript object with 3 properties `actionCreators`, `reducer` and `middlewares`.

the `actionCreators` property contains your action creators and those will be used to create
specialized dispatchers as shown in the counter example.

The `reducer` property contain a function with the following signature:

```js
(state = defaultState, action) => state;
```

The `middlewares` property contain an array of middleware, those will be run between your action creators and your reducers.

In order to build complex application you can combine multiples simple module together to create more complex ones.
Combining multiples module is done by merging their `actionCreators`, their `middlewares` and merging or combining their `reducer` using `mergeReducers` or `combineReducers` accordingly.

#### example

```js
import { combineReducers } from '@ezy/makina';
import * as module1 from './module1';
import * as module2 from './module2';

export const actionCreators = {
  ...module1.actionCreators,
  ...module2.actionCreators
};

export const reducer = combineReducers({
  module1: module1.reducer,
  module2: module2.reducer
});

export const middlewares = [...module1.middlewares, ...module2.middlewares];
```

or using the `createModule` helper function:

```js
import { createModule } from '@ezy/makina';
import module1 from './module1';
import module2 from './module2';

export default createModule({
  modules: {
    module1,
    module2
  }
});
```

@note actionCreators are optional, the dispatch object is also function that dispatch action directly.
@note2 middlewares are also optional.

### defaultIO (optional)

The defaultIO argument is an object containing functions to access the outside world.
When building complex applications I/O can make the testing process a real pain.
Makina provide you a way to deal with that by taking an `overrideIO` argument on the create function
of your state machine factory making a breeze to test scenarios.

note: the `dispatch` and `getState` functions of your state machine is considered as I/O and will be added

#### example

```js
import test from 'ava';
import { factory } from './';

test('user try to login but network fail - ensure notification is created', async t => {
  const stateMachine = factory.create({
    // we change the callApi I/O for this test case
    callApi: () => Promise.reject(new Error('ECONNABORTED'))
  });

  await stateMachine.dipatch.userLogin('bob', 'secretPassword');

  t.is(stateMachine.scopeds.currentUser.getState(), undefined);

  t.deepEqual(stateMachine.scopeds.notifications.getState(), [
    {
      message: 'authentification failed, you seem to be offline'
    }
  ]);
});
```

### selectors (optional)

the third and last argument `selectors` is a plain object containing selectors.
those selectors will be used to create scoped state machines.
they will be available under the `scopeds` property of your state machine.

to create a scoped state machine in a scoped state machine use `extendSelector`.

Ideally if you use a component based UI library every component of your UI should just
import the main state machine or a scoped one and that's it.

#### IMPORTANT

you shouldn't memoize your selectors and they should return a strictly equal value for identical input.
To create complex selectors use `combineSelector` or `mergeSelectors`.

## Hot module replacement

The StateMachineFactory object expose a `replaceModule` function to replace the current module in the StateMachineFactory and in every StateMachine created without changing the current state.
This function is intented to be used for [hot module replacement](https://webpack.js.org/guides/hot-module-replacement/).

### example

```js
import { create } from '@ezy/makina';
import * as root from './modules/index';

export const factory = create(root);

if (module.hot) {
  module.hot.accept('./modules/index', () =>
    factory.replaceModule(require('./modules/index'))
  );
}
```

## Links

[Reference](https://ezylean.github.io/makina)

[Vue Bindings](https://www.npmjs.com/package/@ezy/vue-makina)
