// tslint:disable:no-expression-statement max-classes-per-file
import test from 'ava';
import { lens, lensProp } from 'ramda';
import { createBase, Filterables } from '../index';
import { config } from './config';

config.freeze = Object.freeze;

test.cb('simple', (t) => {
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

  const app = Todos.create({
    todos: [],
  });

  t.deepEqual(app.state, { todos: [] });
  t.is(Object.isFrozen(app.state), true);

  app.onStateChange((state, action, target, currentTarget) => {
    t.deepEqual(state, {
      todos: [{ id: 0, text: 'write a todo' }],
    });

    t.is(Object.isFrozen(state), true);

    t.is(state, app.state);
    t.is(action, 'todoAdded');
    t.is(target, app);
    t.is(currentTarget, app);

    t.end();
  });

  app.addTodo({ id: 0, text: 'write a todo' });
});

test('increment', (t) => {
  class Counter extends createBase()<number> {
    constructor(initialState = 0, IO?, options?) {
      super(initialState, IO, options);
    }

    public increment() {
      this.commit('increment', this.state + 1);
    }
    public decrement() {
      this.commit('decrement', this.state - 1);
    }
  }

  const app = Counter.create();

  t.is(app.state, 0);
  app.increment();
  t.is(app.state, 1);
  app.decrement();
  t.is(app.state, 0);
});

test.cb('nested', (t) => {
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
    modules: {
      todos: Todos,
    },
  });

  class App extends BaseApp {}

  const app = App.create({
    todos: {
      list: [],
    },
  });

  t.deepEqual(app.state, { todos: { list: [] } });

  app.onStateChange((state, action, target, currentTarget) => {
    t.deepEqual(state, {
      todos: {
        list: [{ id: 0, text: 'write a todo' }],
      },
    });

    t.is(state, app.state);

    t.is(action, 'todoAdded');
    t.is(target, app.todos);
    t.is(currentTarget, app);

    t.end();
  });

  app.todos.addTodo({ id: 0, text: 'write a todo' });
});

test('nested w IO & filters', async (t) => {
  interface Notification {
    id: number;
    text: string;
  }

  interface NotificationsState {
    list: Notification[];
  }

  class Notifications extends createBase()<NotificationsState> {
    constructor(initialState: Partial<NotificationsState>, IO = {}, options) {
      super(
        {
          list: [],
          ...initialState,
        },
        IO,
        options
      );
    }

    public add(notification: Notification) {
      this.commit('notificationAdded', {
        list: [...this.state.list, notification],
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
    constructor(initialState: Partial<MessagesState>, IO: MessagesIO, options) {
      super(
        {
          list: [],
          ...initialState,
        },
        IO,
        options
      );
    }

    public refresh() {
      return this.IO.fetchMessages().then((messages) => {
        return this.commit('refreshed', { list: messages });
      });
    }
  }

  const BaseApp = createBase({
    modules: {
      notifications: Notifications,
    },
  });

  class App extends BaseApp<{ messages?: MessagesState }, MessagesIO> {
    public messages: Filterables<Messages> = this.create(
      lensProp('messages'),
      Messages
    );

    protected init() {
      this.messages.refresh.applyFilter(async (next) => {
        const nbMsg = this.messages.state.list.length;
        if (await next()) {
          const newMsg = this.messages.state.list.length - nbMsg;

          if (newMsg > 0) {
            this.notifications.add({
              id: 0,
              text: `${newMsg} new messages`,
            });
          }
          return true;
        }
        return false;
      });
    }
  }

  const app = App.create(
    {},
    {
      fetchMessages: () => Promise.resolve([{ id: 0, text: 'message' }]),
    }
  );

  await app.ready;

  t.deepEqual(app.state, {
    messages: { list: [] },
    notifications: { list: [] },
  });

  await app.messages.refresh();

  t.deepEqual(app.state.messages, { list: [{ id: 0, text: 'message' }] });
  t.deepEqual(app.state.notifications, {
    list: [{ id: 0, text: '1 new messages' }],
  });
});

test('create state machine', (t) => {
  interface Todo {
    id: number;
    title: string;
  }

  interface TodosState {
    list: Todo[];
  }

  class SingleTodo extends createBase()<Todo> {
    public updateTitle(title: string) {
      this.commit('change title', { ...this.state, title });
    }
  }

  class Todos extends createBase()<TodosState> {
    public addTodo(todo: any) {
      this.commit('todoAdded', { list: [...this.state.list, todo] });
    }

    public updateFirstTodoTitle(title: string) {
      this.commit('change first todo title', {
        list: [{ ...this.state.list[0], title }, ...this.state.list.slice(1)],
      });
    }

    public getTodo(id) {
      const todoAtIndex = lens(
        (s: TodosState) => s.list[id],
        (todo, s) => {
          return {
            ...s,
            list: s.list.map((todo2, id2) => (id === id2 ? todo : todo2)),
          };
        }
      );
      return this.create(todoAtIndex, SingleTodo);
    }
  }

  const app = Todos.create({ list: [{ id: 0, title: 'write title' }] });

  const todo3 = app.getTodo(0);

  t.deepEqual(app.state, { list: [{ id: 0, title: 'write title' }] });
  t.deepEqual(todo3.state, { id: 0, title: 'write title' });

  todo3.updateTitle('do something');

  t.deepEqual(app.state, { list: [{ id: 0, title: 'do something' }] });
  t.deepEqual(todo3.state, { id: 0, title: 'do something' });

  app.updateFirstTodoTitle('do something else');

  t.deepEqual(app.state, { list: [{ id: 0, title: 'do something else' }] });
  t.deepEqual(todo3.state, { id: 0, title: 'do something else' });
});

test.cb('listener call sequence + unsubscibe', (t) => {
  class Active extends createBase()<boolean> {}

  interface Todo {
    id: number;
    text: string;
  }

  interface TodosState {
    list: Todo[];
    active: boolean;
  }

  class Todos extends createBase({ modules: { active: Active } })<TodosState> {
    public addTodo(todo: Todo) {
      this.commit('todoAdded', {
        active: true,
        list: [...this.state.list, todo],
      });
    }
  }

  const BaseApp = createBase({
    modules: {
      todos: Todos,
    },
  });

  class App extends BaseApp {
    public addTodo(todo: Todo) {
      this.commit('todoAdded', {
        todos: { active: true, list: [...this.state.todos.list, todo] },
      });
    }
  }

  const app = App.create({
    todos: {
      active: false,
      list: [],
    },
  });

  t.deepEqual(app.state, { todos: { list: [], active: false } });

  const callSequence = ['app.todos.active', 'app.todos', 'app', 'app'];
  const appStates = [
    {
      todos: {
        active: true,
        list: [{ id: 0, text: 'write a todo' }],
      },
    },
    {
      todos: {
        active: true,
        list: [
          { id: 0, text: 'write a todo' },
          { id: 0, text: 'write another todo' },
        ],
      },
    },
  ];

  app.onStateChange((state, action, target, currentTarget) => {
    t.deepEqual(state, appStates.shift());

    t.is(state, app.state);

    t.is(action, 'todoAdded');
    t.is(target, app);
    t.is(currentTarget, app);

    t.is(callSequence.shift(), 'app');
  });

  const unsubscribe = app.todos.onStateChange(
    (state, action, target, currentTarget) => {
      t.deepEqual(state, {
        active: true,
        list: [{ id: 0, text: 'write a todo' }],
      });

      t.is(state, app.todos.state);

      t.is(action, 'todoAdded');
      t.is(target, app);
      t.is(currentTarget, app.todos);

      t.is(callSequence.shift(), 'app.todos');
    }
  );

  const unsubscribe2 = app.todos.active.onStateChange(
    (state, action, target, currentTarget) => {
      t.deepEqual(state, true);

      t.is(state, app.todos.active.state);

      t.is(action, 'todoAdded');
      t.is(target, app);
      t.is(currentTarget, app.todos.active);

      t.is(callSequence.shift(), 'app.todos.active');
    }
  );

  app.addTodo({ id: 0, text: 'write a todo' });

  unsubscribe();
  unsubscribe2();
  unsubscribe2();

  app.addTodo({ id: 0, text: 'write another todo' });

  t.end();
});

test('alternative syntax', (t) => {
  interface Message {
    id: number;
    text: string;
  }

  class Messages extends createBase()<Message[]> {}

  class App extends createBase()<{ messages: Message[] }> {
    public messages: Messages = this.create(lensProp('messages'), Messages);
  }

  const app = new App({
    messages: [{ id: 0, text: 'hello' }],
  });

  t.deepEqual(app.messages.state, [{ id: 0, text: 'hello' }]);
});
