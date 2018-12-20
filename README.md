<p align="center"><img src="https://medv.io/assets/fx-logo.png" height="100" alt="fx logo"></p>
<p align="center"><img src="https://medv.io/assets/fx.gif" width="562" alt="fx example"></p>

_* Function eXecution_

Command-line JSON processing tool

This is a fork of [antonmedv/fx](https://github.com/antonmedv/fx) that differs in the following ways:

- find is plaintext by default, and regex if the query looks like a regex (ie `/\d+ items/i`)
- find is synchronous, so that the total number of hits can be displayed
- find is available via --find on the command line
- keybind "f" will set the filter to the current find path
- keybind "w" will write the current view to a file
- remove the `?` functionality (use `jq .keys` and the like, instead)
- consistency in the bottom bar between filtering, finding, and writing to a file
- fix array handling at the top level of input
- fix initial `.[` and `[` in filter
- implement counts instead of ellipses (`{ 22 }` vs `{…}` and `[ 3 ]` vs `[…]`)

## License

[MIT](https://github.com/antonmedv/fx/blob/master/LICENSE)  
