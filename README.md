<p align="center">
  <img src="https://medv.io/assets/fx-logo.png" height="100" alt="fx logo">
</p>
<p align="center">
  <img src="https://medv.io/assets/fx.gif" width="562" alt="fx example">
</p>

_* Function eXecution_

<<<<<<< HEAD
||||||| merged common ancestors
[![Build Status](https://travis-ci.org/antonmedv/fx.svg?branch=master)](https://travis-ci.org/antonmedv/fx)
[![Npm Version](https://img.shields.io/npm/v/fx.svg)](https://www.npmjs.com/package/fx)
[![Brew Version](https://img.shields.io/homebrew/v/fx.svg)](https://formulae.brew.sh/formula/fx)
[![Snap Version](https://img.shields.io/badge/snap-10.0.0-blue.svg)](https://snapcraft.io/fx)

=======
[![Build Status](https://travis-ci.org/antonmedv/fx.svg?branch=master)](https://travis-ci.org/antonmedv/fx)
[![Npm Version](https://img.shields.io/npm/v/fx.svg)](https://www.npmjs.com/package/fx)
[![Brew Version](https://img.shields.io/homebrew/v/fx.svg)](https://formulae.brew.sh/formula/fx)
[![Snap Version](https://img.shields.io/badge/snap-11.0.1-blue.svg)](https://snapcraft.io/fx)

>>>>>>> upstream/master
Command-line JSON processing tool

<<<<<<< HEAD
This is a fork of [antonmedv/fx](https://github.com/antonmedv/fx).
||||||| merged common ancestors
## Features

* Formatting and highlighting
* Standalone binary
* Interactive mode 🎉
* Themes support 🎨

## Install

```
$ npm install -g fx
```
Or via Homebrew
```
$ brew install fx
```

Or download standalone binary from [releases](https://github.com/antonmedv/fx/releases) page.

<a href="https://www.patreon.com/antonmedv">
	<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## Usage

Start [interactive mode](https://github.com/antonmedv/fx/blob/master/docs.md#interactive-mode) without passing any arguments.
```
$ curl ... | fx
```

Or by passing filename as first argument.
```
$ fx data.json
```

Pipe into `fx` any JSON and anonymous function for reducing it.
```bash
$ curl ... | fx 'json => json.message'
```

Or same as above but short.
```bash
$ curl ... | fx this.message
$ curl ... | fx .message
```

Pass any numbers of arguments as code.
```bash
$ curl ... | fx 'json => json.message' 'json => json.filter(x => x.startsWith("a"))' 
```

Access all lodash (or ramda, etc) methods by using [.fxrc](https://github.com/antonmedv/fx/blob/master/docs.md#using-fxrc) file.
```bash
$ curl ... | fx '_.groupBy("commit.committer.name")' '_.mapValues(_.size)'
```

Update JSON using spread operator.
```bash
$ echo '{"count": 0}' | fx '{...this, count: 1}'
{
  "count": 1
}
```

Pretty print JSON with dot.
```bash
$ curl ... | fx .
```
=======
## Features

* Formatting and highlighting
* Standalone binary
* Interactive mode 🎉
* Themes support 🎨

## Install

```
$ npm install -g fx
```
Or via Homebrew
```
$ brew install fx
```

Or download standalone binary from [releases](https://github.com/antonmedv/fx/releases) page.

<p>
	<a href="https://www.patreon.com/antonmedv"><img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160"></a>
	<a href="https://www.wispay.io/t/ZQb" target="_blank"><img src="https://assets.wispay.io/wgt2_d_b.png" height="60"></a>
</p>

## Usage

Start [interactive mode](https://github.com/antonmedv/fx/blob/master/docs.md#interactive-mode) without passing any arguments.
```
$ curl ... | fx
```

Or by passing filename as first argument.
```
$ fx data.json
```

Pipe into `fx` any JSON and anonymous function for reducing it.
```bash
$ curl ... | fx 'json => json.message'
```

Or same as above but short.
```bash
$ curl ... | fx this.message
$ curl ... | fx .message
```

Pass any numbers of arguments as code.
```bash
$ curl ... | fx 'json => json.message' 'json => json.filter(x => x.startsWith("a"))'
```

Access all lodash (or ramda, etc) methods by using [.fxrc](https://github.com/antonmedv/fx/blob/master/docs.md#using-fxrc) file.
```bash
$ curl ... | fx '_.groupBy("commit.committer.name")' '_.mapValues(_.size)'
```

Update JSON using spread operator.
```bash
$ echo '{"count": 0}' | fx '{...this, count: 1}'
{
  "count": 1
}
```

Pretty print JSON with dot.
```bash
$ curl ... | fx .
```
>>>>>>> upstream/master

### Differences

- find is plaintext by default, and regex if the query looks like a regex (ie
  `/\d+ items/i`)
- find is synchronous, so that the total number of hits can be displayed
- find displays the property/element chain of each hit
- implement counts instead of ellipses (`{ 22 }` vs `{…}` and `[ 3 ]` vs `[…]`)
- bottom bar behaves differently
- slightly more modular require() structure, instead of everything being in
  `fx.js`
- canceling the filter does not apply it
- hitting "." loads the filter with the path under the cursor

### Additions

- find is available via --find on the command line
- key "w" will write the current view to a file
- fix initial `.[` and `[` in filter
- fix keys that start with a digit
- moving left on a leaf-node will collapse up to the parent node

### Removals

- the `?` functionality, use `Object.keys(this)` (or even better, `jq keys`)
- status bar
- generator

## Contributing

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/antonmedv/fx)

Or clone locally and run:

```bash
# install dependencies
npm install

# run fx
node index.js package.json

# run the build
npm run build

# try the built binary
./dist/fx-linux package.json
```

## License

[MIT](https://github.com/antonmedv/fx/blob/master/LICENSE)
