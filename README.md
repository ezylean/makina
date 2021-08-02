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

interface UserProfile {
  email: string;
}

interface CurrentUserState {
  isConnecting?: boolean;
  profile?: UserProfile;
  error?: string;
}

interface Credentials {
  email: string;
  password: string;
}

interface CurrentUserIO {
  api: {
    login: (credentials: Credentials) => Promise<UserProfile>;
  };
}

const CurrentUserBase = createBase({
  states: {
    CONNECTING: {
      is: (state: CurrentUserState) => !!state.isConnecting,
      set: (_: CurrentUserState) => ({ isConnecting: true }),
      from: ['DISCONNECTED'],
    },
    CONNECTED: {
      is: (state: CurrentUserState) => !!state.profile,
      set: (_: CurrentUserState, profile: UserProfile) => ({ profile }),
      from: ['CONNECTING'],
    },
    DISCONNECTED: {
      is: (state: CurrentUserState) => !state.profile,
      set: (_: CurrentUserState, error?: string) => ({ error }),
      from: ['CONNECTING', 'CONNECTED'],
    },
  }
});

class CurrentUser extends CurrentUserBase<CurrentUserState, CurrentUserIO> {
  /**
    * connect currrent user
    *
    * @param credentials
    */
  public async connect(credentials: Credentials) {
    // transition to CONNECTING state
    // there is no transition from CONNECTING to CONNECTING so double clicks are handled for us
    if (this.to.CONNECTING()) {
      try {
        const profile = await this.IO.api.login(credentials);
        return this.to.CONNECTED(profile);
      } catch (e) {
        this.to.DISCONNECTED(e);
      }
    }
    return false;
  }

  /**
    * disconnect currrent user
    */
  public disconnect() {
    return this.to.DISCONNECTED();
  }
}


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

// define our app
const BaseApp = createBase({
  modules: {
    currentUser: CurrentUser,
    notifications: Notifications
  }
});

class App extends BaseApp {

  init() {
    // add a filter to the CurrentUser module connect method
    // our filter will be triggered when the connect method is called
    // to automatically create notification in our Notification module if neccessary
    this.currentUser.connect.applyFilter(async (next, credentials) => {
      if (await next(credentials)) {

        this.notifications.add({
          id: 0,
          text: `welcome back ${this.currentUser.state.profile.email}`
        });

        return true
      }
      return false
    });
  }
  
}

// create an instance of our App with initial state and IOs
const app = App.create(
  {},
  {
    api: {
      login: (credentials: Credentials) => {
        return Promise.resolve({ email: credentials.email });
      }
    }
  }
);


/**
 * wait for all init functions to be called 
 * not necessary in most cases but may be when unit testing
 */
// await app.ready;

// UI bindings
document
  .getElementById('submit')
  .addEventListener('click', () => {
    app.currentUser.connect({ 
      email: document.getElementById('email').value, 
      password: document.getElementById('password').value 
    })
  });

document
  .getElementById('logout')
  .addEventListener('click', () => app.currentUser.disconnect());

const render = () => {
  document.getElementById('notifications').innerHTML = `
    <ul>${
      app.notifications.state.list.map(msg => `<li>${msg.text}</li>`).join('')
    }</ul>
  `;
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
    <title>App</title>
  </head>
  <body>
    <div id="app">
      <button id="logout">X</button> 
      <div id="notifications"></div>
      <form>  
        <label>Email : </label>   
        <input type="text" placeholder="Enter Email" id="email" required>  
        <label>Password : </label>   
        <input type="password" placeholder="Enter Password" id="password" required>  
        <button id="submit">Login</button>  
      </form>
    </div>
    <script src="index.js"></script>
  </body>
</html>
```

### Advanced usage

Under the hood Makina keep your state in a single place and use lenses to update that state

```ts
class App extends createBase({ modules: { messages: Messages } })
```

is equivalent to 

```ts
class App extends createBase()<{ messages: MessagesState }> {
  public messages: Filterables<Messages> = this.create(lensProp('messages'), Messages);
  // or
  // public messages: Filterables<Messages> = this.create('messages', Messages);
}
```

`create` can be used to create state machines targeting just a part of your state on demand.

```ts
class App extends createBase({ modules: { messages: Messages } }) {

  public getMessageByIndex(index) {
    return this.create(lensPath(['messages', 'list', index]), Message);
  }
}
```

alternatively the static `create` method can be used to create detached state machines

```ts
class App extends createBase({ modules: { messages: Messages } }) {

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
  process.env.NODE_ENV !== 'production' ? require('deep-freeze-strict') : undefined;
```

## Plugin system

Every plugin is a decorator factory and can be used to extends Classes generated by `createBase`.

### Example

`myPlugin.ts`
```js
import { StateContainer, StateContainerClass } from '@ezy/makina';

declare class MyPlugin<S> extends StateContainer<S> {
  public isPluginActive (): boolean;
}

declare module '@ezy/makina' {
  interface Plugins<S> {
    myPlugin: S extends { option1: boolean; } 
      ? (options: { option1: boolean; }) => (Base: StateContainerClass) => typeof MyPlugin
      : never;
  }
}

export default {
  name: 'myPlugin',
  decoratorFactory: (options: { option1: boolean; }) =>
  (Base: StateContainerClass) => {
    return class extends Base {

      public isPluginActive () {
        return options.option1
      }

    } as any;
  }
};
```

`app.ts`
```js
import { install, createBase } from '@ezy/makina';
import plugin from './myPlugin'

install(plugin)

const Base = createBase({ 
  myPlugin: { 
    option1: true 
  } 
})

class Customized extends Base<{ somedata: boolean }> {
}
  
const custom = new Customized({ somedata: true })

// => true
custom.isPluginActive()

```

### on plugins type

the plugin type is determined based on if the `options` argument is required

```(options: { option1: boolean; }) => ...``` will only activate the plugin when the `options` argument is provided to createBase. 

```(options: { option1: boolean; } = { option1: false }) => ...``` will activate the plugin regardless if the `options` argument is provided to createBase or not. 

## Links

[Reference](https://ezylean.github.io/makina)

[Vue Bindings](https://www.npmjs.com/package/@ezy/vue-makina)

[Svelte Bindings](https://www.npmjs.com/package/@ezy/svelte-makina)
