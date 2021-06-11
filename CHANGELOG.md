# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [6.0.2](https://github.com/ezylean/makina/compare/v6.0.1...v6.0.2) (2021-06-11)

### [6.0.1](https://github.com/ezylean/makina/compare/v6.0.0...v6.0.1) (2021-06-06)



## [6.0.0](https://github.com/ezylean/makina/compare/v5.0.0...v6.0.0) (2021-06-06)


### Features

* **createbase:** finally add state machine related options ([cfe2dea](https://github.com/ezylean/makina/commit/cfe2dea))


### BREAKING CHANGES

* **createbase:** modules must now be passed to createbase in the modules key and commit now return a
boolean



## [5.0.0](https://github.com/ezylean/makina/compare/v4.1.1...v5.0.0) (2021-05-27)


### Features

* **general:** refactoring + add StateMachine Factory ([74177b8](https://github.com/ezylean/makina/commit/74177b8))


### BREAKING CHANGES

* **general:** most types have changed



### [4.1.1](https://github.com/ezylean/makina/compare/v4.1.0...v4.1.1) (2021-04-05)



## [4.1.0](https://github.com/ezylean/makina/compare/v4.0.0...v4.1.0) (2021-03-24)


### Features

* **createbase:** allow async init functions + binded methods module ([ebd108d](https://github.com/ezylean/makina/commit/ebd108d))



## [4.0.0](https://github.com/ezylean/makina/compare/v3.0.1...v4.0.0) (2021-01-26)


### Features

* **add support for splitlens + remove ramda:** split lenses can now be used everywhere lenses can ([44fb979](https://github.com/ezylean/makina/commit/44fb979))


### BREAKING CHANGES

* **add support for splitlens + remove ramda:** over, lens, lensProp, lensIndex and lensPath can no longer be imported from this
library, if needed import them directly from ramda



### [3.0.1](https://github.com/ezylean/makina/compare/v3.0.0...v3.0.1) (2021-01-19)



## [3.0.0](https://github.com/ezylean/makina/compare/v2.3.0...v3.0.0) (2021-01-16)


### Bug Fixes

* **create:** fix create + add a ready Promise on stateMachines ([c0c5ccb](https://github.com/ezylean/makina/commit/c0c5ccb))


### BREAKING CHANGES

* **create:** init call is now asynchronous



## [2.3.0](https://github.com/ezylean/makina/compare/v2.2.0...v2.3.0) (2021-01-15)


### Features

* **constructors:** its now possible to set default state in constructors + better typings ([1dafb04](https://github.com/ezylean/makina/commit/1dafb04))



## [2.2.0](https://github.com/ezylean/makina/compare/v2.1.0...v2.2.0) (2021-01-13)


### Features

* **general:** complete rewrite ([2417a66](https://github.com/ezylean/makina/commit/2417a66))



## [2.1.0](https://github.com/ezylean/makina/compare/v2.0.3...v2.1.0) (2021-01-09)


### Features

* **onstatechange:** add target and currentTarget parameters ([b4ce8b9](https://github.com/ezylean/makina/commit/b4ce8b9))



### [2.0.3](https://github.com/ezylean/makina/compare/v2.0.2...v2.0.3) (2021-01-07)



### [2.0.2](https://github.com/ezylean/makina/compare/v2.0.1...v2.0.2) (2021-01-07)



### [2.0.1](https://github.com/ezylean/makina/compare/v2.0.0...v2.0.1) (2021-01-05)


### Bug Fixes

* **onstatechange:** fix state change propagation ([c1f1699](https://github.com/ezylean/makina/commit/c1f1699))



## [2.0.0](https://github.com/ezylean/makina/compare/v1.2.2...v2.0.0) (2021-01-04)


### Features

* **general:** complete rewrite ([a2ac671](https://github.com/ezylean/makina/commit/a2ac671))


### BREAKING CHANGES

* **general:** everything



### [1.2.2](https://github.com/ezylean/makina/compare/v1.2.1...v1.2.2) (2020-04-02)



### [1.2.1](https://github.com/ezylean/makina/compare/v1.2.0...v1.2.1) (2020-03-23)


### Bug Fixes

* **typings:** fix IO mismatch when IO is typed in a submodule of a combined module ([5a0a10e](https://github.com/ezylean/makina/commit/5a0a10e))



## [1.2.0](https://github.com/ezylean/makina/compare/v1.1.0...v1.2.0) (2020-03-22)


### Bug Fixes

* **type inference:** fix type inference on literal string action type ([a57b0de](https://github.com/ezylean/makina/commit/a57b0de))


### Features

* **createmodule:** add createModule helper function ([d81b51f](https://github.com/ezylean/makina/commit/d81b51f))



## [1.1.0](https://github.com/ezylean/makina/compare/v1.0.7...v1.1.0) (2020-03-13)


### Features

* **replacemodule:** add replaceModule to StateMachineFactory to allow hot module replacement ([cecf0d2](https://github.com/ezylean/makina/commit/cecf0d2))



### [1.0.7](https://github.com/ezylean/makina/compare/v1.0.6...v1.0.7) (2020-03-09)



### [1.0.6](https://github.com/ezylean/makina/compare/v1.0.5...v1.0.6) (2020-03-08)


### Bug Fixes

* **typings:** fix typings of dispatch in middlewares ([de942f3](https://github.com/ezylean/makina/commit/de942f3))



### [1.0.5](https://github.com/ezylean/makina/compare/v1.0.4...v1.0.5) (2020-03-08)



### [1.0.4](https://github.com/ezylean/makina/compare/v1.0.3...v1.0.4) (2020-03-08)


### Build System

* **package.json:** declare no sideEffects ([4df8dba](https://github.com/ezylean/makina/commit/4df8dba))



### [1.0.3](https://github.com/ezylean/makina/compare/v1.0.2...v1.0.3) (2020-03-08)



### [1.0.2](https://github.com/ezylean/makina/compare/v1.0.1...v1.0.2) (2020-03-08)



### [1.0.1](https://github.com/ezylean/makina/compare/v1.0.0...v1.0.1) (2020-03-07)



## 1.0.0 (2020-03-07)


### Features

* **general:** initial commit ([2db054e](https://github.com/ezylean/makina/commit/2db054e))
