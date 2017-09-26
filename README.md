<!-- MarkdownTOC -->

- [Setup](#setup)
- [Running](#running)
- [Implementation details](#implementation-details)
	- [Other noteworthy bits](#other-noteworthy-bits)
- [Notes on testing](#notes-on-testing)
	- [Truffle wishlist](#truffle-wishlist)
- [Todo](#todo)
	- [Testing related](#testing-related)
	- [Misc](#misc)
	- [Known issues](#known-issues)

<!-- /MarkdownTOC -->


## Setup

- `npm i`


## Running

- `npm run test` to run test suite
- `npm run test:watch` to run tests in watch mode for development


## Implementation details

I enjoyed working on this app, but found it a little contrived. I would have liked to see something architected to a more robust data model like [Eris have tried to standardise](https://monax.io/docs/tutorials/solidity/solidity_1_the_five_types_model/). These were also concerns I overlooked in part 1! But really... this project is just one giant contract compartmentalised by traits / mixins. I feel that's overly simplifying.

I spent quite some time on trying to get [an immediate connection to my code](https://vimeo.com/36579366). There are some reasonably decent tools out there, but the Ethereum ecosystem is clearly very young. First I experimented with linting. This is absolutely a requirement for pain-free solidity dev (eg. hard-to-catch errors like return variable name shadowing). `solium` is kinda OK, but `solcheck` looks like a more quality codebase with an eslint-like approach. I suspect I will be helping contribute to it sometime soon.

I then found that `truffle watch` is broken, sent a PR to fix that, found it was a deeper issue & finally implemented my own version using an `npm-watch` wrapper. This gives me reasonably fast feedback, but not nearly fast enough!

Otherwise, that's about all I managed to get through. I followed a TDD development style and wrote unit tests as I went based on requirements. This really helped in debugging later bugs in more complex test scripts.

Oh, and I wrote everything in the most modern possible flavour of JavaScript. `async`/`await` tests are so much nicer and less painful to write!

### Other noteworthy bits

- `test/TestTollBoothOperator.sol` has some use of tuple unpacking in it.
- In order to exercise regulator change tests in `test/regulated.sol`, `Regulator::delegateRegulatorRole()` had to be added to proxy the operation through to its target `Regulated`.
- Tests used to use [solidity-sha3](https://github.com/raineorshine/solidity-sha3) to exercise the vehicle exit nonce functionality. I thought this was a nicer way of doing it than depending on the contracts for execution, but though I managed to get matching hashes computed in both environments I never figured out some typecasting issue and fell back to `hashSecret()`.
- I went and added an env var `SKIP_SLOW_STUFF` to stop that enormous stress test running. Would love to know what the point of that was! Again- why test things that others have already tested?


## Notes on testing

I felt I should make a point of discussing "good testing" vs. "overtesting". There is an excellent bit of reading on [test practises for React/Redux](https://medium.com/javascript-inside/some-thoughts-on-testing-react-redux-applications-8571fbc1b78f) which I'll take a lot of inspiration from here.

In short:

- Don't cover the same stuff multiple times
- Don't re-test existing libraries or frameworks, let their own tests handle that

Testing all parts of a tx log seems like a heap of overkill, and doing so using numerical indices is extremely brittle (thus making your implementations inflexible). Use functional programming techniques to filter down the bits you want to check for instead! eg: `tx.logs.find(l => l.event === 'LogTollBoothOperatorCreated').args.newOperator`.

I found some of the tests quite interesting (read: strange)- particularly around the base classes. I like that all those tests are in the one file, but not that every child class has to be tested. Ideally there would be a cheaper way to verify that a contract has a base class correctly applied, such as inspection of the AST.

I also found myself developing a nice rule of thumb for where to write tests:

- Ideally, they'd all be written in Solidity... but we're not there yet!
- For testing exceptions, you HAVE to use JS tests (unless you're super clever & want to deal with [some caveats](http://truffleframework.com/tutorials/testing-for-throws-in-solidity-tests))
- Where tests involve accounts, use JS tests

Debugging is tough. It often comes down to adding debug logging code and commenting out conditions. Feels like I've timewarped back to 1999 web dev... good times. Being able to return error messages is going to be a massive time-saver.

I've also included `internals/generate-solidity-diagrams.sh`, which generates diagrams of the contract call graphs. I found this useful in debugging the `TollBoothOperator` functionality once I'd started abstracting functionality into internal methods.
    

### Truffle wishlist

This is mainly for myself so I remember to chat to the Truffle team about this.

- Be able to cache contracts independently and re-use them between dependant commands
- Have dependant commands reload appropriately ONLY IF contract/js dependencies change
	- This may just be a case of integrating `artifacts.require` with the node module resolution API
- Be able to run sets of tests more easily using shell globs
- Stack traces from VM exceptions would be actually useful if they were tied to the calling code line. As it is, a lot of them get swallowed in the `Promise` chain.

Also, can't wait for the day when I can test against error conditions in calling code! Hurry up `revert`.



## Todo

This whole thing has been super rushed for me and is in no way my best work! Really I mostly smashed this out in two nights. Not sure how you plan on grading this, but for a chance at partial credit these are the things I would have done.

The UI is the main piece. I have actually started my [own boilerplate](https://github.com/pospi/truffle-fusebox-boilerplate) which I aim to replace the truffle Webpack boilerplates with. Fusebox is a billion times better and I am so happy to have given Webpack the flick.

These libs would have been my choices for a React integration, but I actually think I could do a better job with Redux so I may release my own soon:

- https://www.npmjs.com/package/web3-redux
- https://www.npmjs.com/package/redux-contract

The UI would have meant more work on accessors, too (historical trip data and so on).

### Testing related

- Earlier tests don't take advantage of the `beforeEach` hook as much as they could.
- Ensure all events are triggered as expected. I opted to focus on logic / data in the time I had, but I am aware that the event interface is part of the external API and it should be tested.
- I never tested the `Pausable` inheritance hierarchy, just the base class. Presence of this functionality in child classes is somewhat covered by calls to `setPausable()` which would cause other tests to fail.
- Could have simulated failure to `.send()` in `TollBoothOperator::withdrawCollectedFees()` with some gas math and stack pre-preparation code, but I left that rabbit hole alone.

### Misc

- Started some work on running `geth` in an isolated manner due to encountering some issues with `testrpc`. Mostly works but the VM is configured slightly differently and need to understand that to fix.

### Known issues

- Something is wrong internally in `TollBoothOperator::handleVehicleExit()` or other supporting methods, as such I can't get the final value-related assertions in *scenario 6* to work. It appears that clearing subsequent pending payments from the contract messes up an index, and vehicles which *should* exist end up being logged as 'pending' instead of 'exit'.
- I originally implemented the road exit logic to clear out the struct data- in thinking about a UI app I can now see the benefit of retaining it in order to track a vehicle travel log (some additional indexing members notwithstanding). This means that `tollBoothOperator_student.js` will fail some tests. I would add that the way you're writing your tests seems far too invasive- we should be testing minimal footprint in order to keep a flexible codebase, not causing more work for ourselves with unrelated assertions.
