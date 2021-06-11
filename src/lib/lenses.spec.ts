// tslint:disable:no-expression-statement max-classes-per-file
import test from 'ava';
import { lensFilter, lensFind, lensSort, set, view } from './lenses';

/**
 * @ignore
 */
interface User {
  name: string;
  age: number;
}

/**
 * @ignore
 */
const users = [
  { name: 'jane', age: 19 },
  { name: 'mike', age: 21 },
  { name: 'marco', age: 12 },
  { name: 'aline', age: 56 },
  { name: 'polo', age: 16 },
];

test('lensFind', (t) => {
  const firstUserOver21 = lensFind((user: User) => user.age >= 21);

  t.deepEqual(view(firstUserOver21, users), { name: 'mike', age: 21 });

  t.deepEqual(set(firstUserOver21, { name: 'super mike', age: 21 }, users), [
    { name: 'jane', age: 19 },
    { name: 'super mike', age: 21 },
    { name: 'marco', age: 12 },
    { name: 'aline', age: 56 },
    { name: 'polo', age: 16 },
  ]);
});

test('lensFind - no results', (t) => {
  const deadz = lensFind((user: User) => user.age > 9000);

  t.is(view(deadz, users), undefined);

  t.is(set(deadz, { name: 'super mike', age: 21 }, users), users);
});

test('lensFilter', (t) => {
  const usersOver21 = lensFilter((user: User) => user.age >= 21);

  t.deepEqual(view(usersOver21, users), [
    { name: 'mike', age: 21 },
    { name: 'aline', age: 56 },
  ]);

  t.deepEqual(
    set(
      usersOver21,
      [
        { name: 'super mike', age: 21 },
        { name: 'super aline', age: 56 },
      ],
      users
    ),
    [
      { name: 'jane', age: 19 },
      { name: 'super mike', age: 21 },
      { name: 'marco', age: 12 },
      { name: 'super aline', age: 56 },
      { name: 'polo', age: 16 },
    ]
  );
});

test('lensFilter - no results', (t) => {
  const deadz = lensFilter((user: User) => user.age > 9000);

  t.deepEqual(view(deadz, users), []);

  t.is(
    set(
      deadz,
      [
        { name: 'super mike', age: 21 },
        { name: 'super aline', age: 56 },
      ],
      users
    ),
    users
  );
});

test('lensSort', (t) => {
  const sortedUsersOver21 = lensSort((user1: User, user2: User) =>
    user1.age > user2.age ? 1 : user1.age < user2.age ? -1 : 0
  );

  t.deepEqual(view(sortedUsersOver21, users), [
    { name: 'marco', age: 12 },
    { name: 'polo', age: 16 },
    { name: 'jane', age: 19 },
    { name: 'mike', age: 21 },
    { name: 'aline', age: 56 },
  ]);

  const newData = [
    { name: 'young marco', age: 12 },
    { name: 'young polo', age: 16 },
    { name: 'young jane', age: 19 },
    { name: 'mike', age: 21 },
    { name: 'aline', age: 56 },
  ];

  t.deepEqual(set(sortedUsersOver21, newData, users), [
    { name: 'young jane', age: 19 },
    { name: 'mike', age: 21 },
    { name: 'young marco', age: 12 },
    { name: 'aline', age: 56 },
    { name: 'young polo', age: 16 },
  ]);
});

test('lensSort - default comparator', (t) => {
  const listnbr = [1, 5, 9, 8, 7, 6, 3, 5, 4, 0];

  t.deepEqual(view(lensSort(), listnbr), [0, 1, 3, 4, 5, 5, 6, 7, 8, 9]);

  const listnbrSortedChanged = [0, 1, 3, 4, 5, 5000, 6, 7, 8, 9];

  t.deepEqual(
    set(lensSort(), listnbrSortedChanged, listnbr),
    [1, 5, 9, 8, 7, 6, 3, 5000, 4, 0]
  );
});
