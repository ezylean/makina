<p align="center">
  <br/>
  <br/>
  <img src="https://raw.githubusercontent.com/ezylean/makina/master/logo.png" alt="Makina" width="200px"/>
  <br/>
  <br/>
</p>

<p align="center">create a backend in your frontend</p>

## Why

Writing frontend applications is difficult.

Makina may help you create an all-in-one backend for your frontend.

## Mental model

In Makina you should think of your frontend application as a complete stack, with your UI (React, Vue, Angular, etc...) as the frontend part and a StateMachine as a backend.

Application logic, I/O and state management of your application will be managed in the StateMachine while the UI will be responsible for presentational logic, displaying the current state and dispatch actions.

## Getting Started

### Installation

```shell
  npm i @ezy/makina
```

### Main Concepts

* the class factory `createBase` to create and combine modules.
* `filters`, to orchestrate them.

### Example

index.ts

```ts
import { createBase } from '@ezy/makina';

interface Notification {
  id: number,
  text: string
}

interface NotificationsState {
  list: Notification[]
}

// create a Notifications module
class Notifications extends createBase()<NotificationsState> {

  constructor(initialState, IO, options) {
    // default state
    super({ list: [], ...initialState }, IO, options)
  }

  add(notification) {
    this.commit('notificationAdded', {
      list: [...this.state.list, notification]
    });
  }
}

interface Message {
  id: number,
  text: string
}

interface MessagesState {
  list: Message[]
}

interface MessagesIO {
  fetchMessages: () => Promise<Message[]>;
}

// create a Messages module
class Messages extends createBase()<MessagesState, MessagesIO> {

  constructor(initialState, IO, options) {
    // default state
    super({ list: [], ...initialState }, IO, options)
  }

  refresh() {
    return this.IO.fetchMessages().then(messages => {
      this.commit('refreshed', { list: messages });
    });
  }
}

// define our app
const BaseApp = createBase({
  messages: Messages,
  notifications: Notifications
});

class App extends BaseApp {

  init() {
    // add a filter to the Messages module refresh function
    // our filter will be triggered when the refresh function is called
    // to automatically create notification in our Notification module if neccessary
    this.messages.refresh.applyFilter(async (next) => {
      const nbMsg = this.messages.state.list.length;
      await next();
      const newMsg = this.messages.state.list.length - nbMsg;

      if (newMsg > 0) {
        this.notifications.add({
          id: 0,
          text: `${newMsg} new messages`
        });
      }
    });
  }
  
}

// create an instance of our App with initial state and IOs
const app = App.create(
  {},
  {
    messages: {
      fetchMessages: () => Promise.resolve([{ id: 0, text: 'message' }])
    },
    notifications: {}
  }
);


/**
 * wait for all init functions to be called 
 * not necessary in most cases but may be when unit testing
 */
// await app.ready;

// UI bindings
document
  .getElementById('refresh')
  .addEventListener('click', () => app.messages.refresh());

const render = () => {
  document.getElementById('messages').innerHTML = `<ul>${app.messages.state.list.map(msg => `<li>${msg.text}</li>`).join('')}</ul>`;
  document.getElementById('notifications').innerHTML = `<ul>${app.notifications.state.list.map(msg => `<li>${msg.text}</li>`).join('')}</ul>`;
};

app.onStateChange(render);
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
      <button id="refresh">refresh</button>
      <div id="notifications"></div>
      <div id="messages"></div>
    </div>
    <script src="index.js"></script>
  </body>
</html>
```

### Advanced usage

Under the hood Makina keep your state in a single place and use lenses to update that state

```ts
class App extends createBase({ messages: Messages })
```

is equivalent to 

```ts
class App extends createBase<{ messages: typeof Messages }>({} as any) {
  public messages: StateMachine<Messages> = this.create(lensProp('messages'), Messages);
}
```

`create` can be used to create state machines targeting just a part of your state on demand.

```ts
class App extends createBase({ messages: Messages }) {

  public getMessageByIndex(index) {
    return this.create(lensPath(['messages', 'list', index]), Message);
  }
}
```

alternatively the static `create` method can be used to create detached state machines

```ts
class App extends createBase({ messages: Messages }) {

  public getMessageByIndex(index) {
    return Message.create(this.state.messages.list[index], this.IO)
  }
}
```

#### available lenses utils
- view
- set
- lensFind
- lensFilter
- lensSort
- splitLensProp
- lensToSplitLens


[read more on lenses](https://ramdajs.com/docs/#lens)

##### *on split lenses*

lenses being a composable pair of pure getter and setter functions, 
Makina also handle split lenses which is just a pure getter and a pure setter in an object.

###### Example

```js
  const nameSplitLens = {
    get: (s) => s.name,
    set: (name, s) => ({ ...s, name })
  }
```

## Immutable state guarantee

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

## Links

[Reference](https://ezylean.github.io/makina)

[Vue Bindings](https://www.npmjs.com/package/@ezy/vue-makina)

[Svelte Bindings](https://www.npmjs.com/package/@ezy/svelte-makina)
