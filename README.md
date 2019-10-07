## Request timer

[![Build status](https://img.shields.io/travis/TinkoffCreditSystems/server-request-timer/master.svg?style=flat-square)](https://travis-ci.org/TinkoffCreditSystems/server-request-timer)
[![Coveralls github](https://img.shields.io/coveralls/github/TinkoffCreditSystems/server-request-timer.svg?style=flat-square)](https://coveralls.io/github/TinkoffCreditSystems/server-request-timer)
[![Written in typescript](https://img.shields.io/badge/written_in-typescript-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/server-request-timer.svg?style=flat-square)](https://www.npmjs.com/package/server-request-timer)

A library for analyzing request execution.
The result of its work is a list of request execution phases with time spent on each phase.

 - `wait` - time from creating a request to establishing a socket connection

 - `dns` - time from establishing socket connection to request to DNS

 - `tcp` - time from request to DNS to connection establishment

 - `request` - time from the establishment of the connection to the completion of sending data

 - `firstByte` - time from completion of sending data to receiving the first bytes

 - `download` - time from receiving the first bytes to the completion of the request

 - `total` - from time to time from the creation of the request to the completion of the request or error (at any stage)

**Important:**
You cannot call the subscribe method twice on same `request`

**Usage example:**
```typescript
import RequestTimer from 'server-request-timer';

const requestTimer = new RequestTimer();

requestTimer.subscribe(request); // Native http.request
const result = requestTimer.calcTimings();
```
## License

```
Copyright 2019 Tinkoff Bank

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
