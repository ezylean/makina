// tslint:disable:max-classes-per-file
import test from 'ava';
import { createBase } from './';

test('state machine string enum', async (t) => {
  enum CURRENT_USER {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
  }

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

  const Base = createBase({
    states: {
      [CURRENT_USER.CONNECTING]: (state: CurrentUserState) =>
        state.isConnecting,
      [CURRENT_USER.CONNECTED]: (state: CurrentUserState) => !!state.profile,
      [CURRENT_USER.DISCONNECTED]: (state: CurrentUserState) => !state.profile,
    },
    transitions: {
      [CURRENT_USER.DISCONNECTED]: [CURRENT_USER.CONNECTING],
      [CURRENT_USER.CONNECTING]: [
        CURRENT_USER.CONNECTED,
        CURRENT_USER.DISCONNECTED,
      ],
      [CURRENT_USER.CONNECTED]: [CURRENT_USER.DISCONNECTED],
    },
  });

  class CurrentUser extends Base<CurrentUserState, CurrentUserIO> {
    /**
     * connect currrent user
     *
     * @param credentials
     */
    public async connect(credentials: Credentials) {
      if (this.commit(CURRENT_USER.CONNECTING, { isConnecting: true })) {
        try {
          const profile = await this.IO.api.login(credentials);
          return this.commit(CURRENT_USER.CONNECTED, {
            isConnecting: false,
            profile,
          });
        } catch (e) {
          return this.commit(CURRENT_USER.DISCONNECTED, {
            error: e,
            isConnecting: false,
          });
        }
      }
      return false;
    }

    /**
     * disconnect currrent user
     */
    public disconnect() {
      return this.commit(CURRENT_USER.DISCONNECTED, {});
    }
  }

  const api = {
    login: (credentials: Credentials) => {
      return Promise.resolve({ email: credentials.email });
    },
  };

  const currentUser = CurrentUser.create({}, { api });

  t.is(currentUser.is.DISCONNECTED, true);
  t.is(currentUser.is.CONNECTING, false);
  t.is(currentUser.is.CONNECTED, false);

  currentUser.disconnect();

  t.is(currentUser.is.DISCONNECTED, true);
  t.is(currentUser.is.CONNECTING, false);
  t.is(currentUser.is.CONNECTED, false);

  await currentUser.connect({ email: 'doe@mail.com', password: 'password' });

  t.is(currentUser.is.CONNECTED, true);
  t.is(currentUser.is.CONNECTING, false);
  t.is(currentUser.is.DISCONNECTED, false);
});

test('state machine number enum', async (t) => {
  enum CURRENT_USER {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
  }

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

  const Base = createBase({
    states: {
      [CURRENT_USER.CONNECTING]: (state: CurrentUserState) =>
        state.isConnecting,
      [CURRENT_USER.CONNECTED]: (state: CurrentUserState) => !!state.profile,
      [CURRENT_USER.DISCONNECTED]: (state: CurrentUserState) => !state.profile,
    },
    transitions: {
      [CURRENT_USER.DISCONNECTED]: [CURRENT_USER.CONNECTING],
      [CURRENT_USER.CONNECTING]: [
        CURRENT_USER.CONNECTED,
        CURRENT_USER.DISCONNECTED,
      ],
      [CURRENT_USER.CONNECTED]: [CURRENT_USER.DISCONNECTED],
    },
  });

  class CurrentUser extends Base<CurrentUserState, CurrentUserIO> {
    /**
     * connect currrent user
     *
     * @param credentials
     */
    public async connect(credentials: Credentials) {
      if (this.commit(CURRENT_USER.CONNECTING, { isConnecting: true })) {
        try {
          const profile = await this.IO.api.login(credentials);
          return this.commit(CURRENT_USER.CONNECTED, {
            isConnecting: false,
            profile,
          });
        } catch (e) {
          return this.commit(CURRENT_USER.DISCONNECTED, {
            error: e,
            isConnecting: false,
          });
        }
      }
      return false;
    }

    /**
     * disconnect currrent user
     */
    public disconnect() {
      return this.commit(CURRENT_USER.DISCONNECTED, {});
    }
  }

  const api = {
    login: (credentials: Credentials) => {
      return Promise.resolve({ email: credentials.email });
    },
  };

  const currentUser = CurrentUser.create(
    {
      profile: {
        email: 'doe@mail.com',
      },
    },
    { api }
  );

  t.is(currentUser.is[CURRENT_USER.CONNECTED], true);
  t.is(currentUser.is[CURRENT_USER.CONNECTING], false);
  t.is(currentUser.is[CURRENT_USER.DISCONNECTED], false);

  currentUser.disconnect();

  t.is(currentUser.is[CURRENT_USER.DISCONNECTED], true);
  t.is(currentUser.is[CURRENT_USER.CONNECTING], false);
  t.is(currentUser.is[CURRENT_USER.CONNECTED], false);

  await currentUser.connect({ email: 'doe@mail.com', password: 'password' });

  t.is(currentUser.is[CURRENT_USER.CONNECTED], true);
  t.is(currentUser.is[CURRENT_USER.CONNECTING], false);
  t.is(currentUser.is[CURRENT_USER.DISCONNECTED], false);
});
