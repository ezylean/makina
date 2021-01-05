// tslint:disable:no-expression-statement max-classes-per-file
import test from 'ava';
import { createBase } from './createBase';

// interface AuthentificationState {
//   currentUser?: { username: string };
// }

// interface AuthentificationEvents {
//   currentUserChanged: { username: string }
// }

// class Authentification extends createBase()<AuthentificationState, AuthentificationEvents> {
//   public login(username: string) {
//     const currentUser = { username };
//     this.commit('userLoggedIn', { currentUser });
//     this.emit('currentUserChanged', currentUser);
//   }
// }

test.cb('simple', t => {
  interface Todo {
    id: number;
    text: string;
  }

  interface TodosState {
    todos: Todo[];
  }

  class Todos extends createBase()<TodosState> {
    public addTodo(todo: Todo) {
      this.commit('todoAdded', { todos: [...this.state.todos, todo] });
    }
  }

  const app = new Todos({
    todos: []
  });

  t.deepEqual(app.state, { todos: [] });

  app.onStateChange((state, action) => {
    t.deepEqual(state, {
      todos: [{ id: 0, text: 'write a todo' }]
    });

    t.is(state, app.state);

    t.is(action, 'Todos:todoAdded');

    t.end();
  });

  app.addTodo({ id: 0, text: 'write a todo' });
});

test('increment', t => {
  class Counter extends createBase()<number> {
    constructor(initialState = 0) {
      super(initialState);
    }

    public increment() {
      this.commit('increment', this.state + 1);
    }
    public decrement() {
      this.commit('decrement', this.state - 1);
    }
  }

  const app = new Counter();

  t.is(app.state, 0);
  app.increment();
  t.is(app.state, 1);
  app.decrement();
  t.is(app.state, 0);
});

test.cb('nested', t => {
  interface Todo {
    id: number;
    text: string;
  }

  interface TodosState {
    list: Todo[];
  }

  class Todos extends createBase()<TodosState> {
    public addTodo(todo: Todo) {
      this.commit('todoAdded', { list: [...this.state.list, todo] });
    }
  }

  const BaseApp = createBase({
    todos: Todos
  });

  class App extends BaseApp {}

  const app = new App({
    todos: {
      list: []
    }
  });

  t.deepEqual(app.state, { todos: { list: [] } });

  app.onStateChange((state, action) => {
    t.deepEqual(state, {
      todos: {
        list: [{ id: 0, text: 'write a todo' }]
      }
    });

    t.is(state, app.state);

    t.is(action, 'Todos:todoAdded');

    t.end();
  });

  app.todos.addTodo({ id: 0, text: 'write a todo' });
});

test('nested w IO & filters', async t => {
  interface Notification {
    id: number;
    text: string;
  }

  interface NotificationsState {
    list: Notification[];
  }

  class Notifications extends createBase()<NotificationsState> {
    public add(notification: Notification) {
      this.commit('notificationAdded', {
        list: [...this.state.list, notification]
      });
    }
  }

  interface Message {
    id: number;
    text: string;
  }

  interface MessagesState {
    list: Message[];
  }

  interface MessagesIO {
    fetchMessages: () => Promise<Message[]>;
  }

  class Messages extends createBase()<MessagesState, MessagesIO> {
    public refresh() {
      return this.IO.fetchMessages().then(messages => {
        return this.commit('refreshed', { list: messages });
      });
    }
  }

  const BaseApp = createBase({
    messages: Messages,
    notifications: Notifications
  });

  class App extends BaseApp {
    protected init() {
      this.messages.refresh.applyFilter(next => {
        const nbMsg = this.messages.state.list.length;
        return next().then(() => {
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

  t.deepEqual(app.state, {
    messages: { list: [] },
    notifications: { list: [] }
  });

  await app.messages.refresh();

  t.deepEqual(app.state.messages, { list: [{ id: 0, text: 'message' }] });
  t.deepEqual(app.state.notifications, {
    list: [{ id: 0, text: '1 new messages' }]
  });
});
