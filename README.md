<p align="center">
  <img src="https://medv.io/assets/fx-logo.png" height="100" alt="fx logo">
</p>
<p align="center">
  <img src="https://medv.io/assets/fx.gif" width="562" alt="fx example">
</p>

_* Function eXecution_

Command-line JSON processing tool

This is a fork of [antonmedv/fx](https://github.com/antonmedv/fx).

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

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/brewingcode/fx)

Or clone locally and run:

```bash
# install dependencies
npm install

# run fx from node_modules
npx fx package.json

# or install globally and run anywhere
npm link
fx package.json

# run the build binary
npm run build
./dist/fx-linux package.json
```

## License

[MIT](https://github.com/antonmedv/fx/blob/master/LICENSE)
