<p align="center">
  <br/>
  <br/>
  <img src="https://raw.githubusercontent.com/ezylean/makina/master/logo.png" alt="Makina" width="200px"/>
  <br/>
  <br/>
</p>

<p align="center">create a backend in your frontend</p>

## Why

Writing frontend applications is a mess.

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

index.js

```js
import { createBase } from '@ezy/makina';

// create a Notifications module
class Notifications extends createBase() {
  add(notification) {
    this.commit('notificationAdded', {
      list: [...this.state.list, notification]
    });
  }
}

// create a Messages module
class Messages extends createBase() {
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
    this.messages.refresh.applyFilter(next => {
      // previous nb of messages
      const nbMsg = this.messages.state.list.length;

      return next().then(() => {
        // total new messages
        const newMsg = this.messages.state.list.length - nbMsg;

        if (newMsg > 0) {
          this.notifications.add({
            id: 0,
            text: `${newMsg} new messages`
          });
        }
      });
    });
  }
  
}

// create an instance of our App with initial state and IOs
const app = new App(
  {
    messages: {
      list: []
    },
    notifications: {
      list: []
    }
  },
  {
    messages: {
      fetchMessages: () => Promise.resolve([{ id: 0, text: 'message' }])
    },
    notifications: {}
  }
);

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
