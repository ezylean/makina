// tslint:disable:max-classes-per-file
import test from 'ava';
import { createBase } from './';

test('state machine', async (t) => {
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
      CONNECTING: {
        is: (state: CurrentUserState) => state.isConnecting,
        set: (_: CurrentUserState) => ({ isConnecting: true }),
        from: ['DISCONNECTED'],
      },
      CONNECTED: {
        is: (state: CurrentUserState) => !!state.profile,
        set: (_: CurrentUserState, profile: UserProfile) => ({
          isConnecting: false,
          profile: profile,
        }),
        from: ['CONNECTING'],
      },
      DISCONNECTED: {
        is: (state: CurrentUserState) => !state.profile,
        set: (_: CurrentUserState, error?: string) => ({ error }),
        from: ['CONNECTING', 'CONNECTED'],
      },
    },
  });

  class CurrentUser extends Base<CurrentUserState, CurrentUserIO> {
    /**
     * connect currrent user
     *
     * @param credentials
     */
    public async connect(credentials: Credentials) {
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

  t.is(currentUser.is.CONNECTED, true);
  t.is(currentUser.is.CONNECTING, false);
  t.is(currentUser.is.DISCONNECTED, false);

  currentUser.disconnect();

  t.is(currentUser.is.DISCONNECTED, true);
  t.is(currentUser.is.CONNECTING, false);
  t.is(currentUser.is.CONNECTED, false);

  t.is(
    await currentUser.connect({ email: 'doe@mail.com', password: 'password' }),
    true
  );
  t.is(
    await currentUser.connect({ email: 'doe@mail.com', password: 'password' }),
    false
  );

  t.is(currentUser.is.CONNECTED, true);
  t.is(currentUser.is.CONNECTING, false);
  t.is(currentUser.is.DISCONNECTED, false);
});
