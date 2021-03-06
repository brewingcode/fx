'use strict'
const fs = require('fs')
const tty = require('tty')
const blessed = require('@medv/blessed')
const stringWidth = require('string-width')
const { walk, reduce, popPath, appendPath } = require('./helpers')
const print = require('./print')
const search = require('./search')
const write = require('./write')
const config = require('./config')
const clip = require('clipboardy')

function log(s) {
  fs.appendFileSync('/tmp/fx.log', s.replace(/\n*$/, '\n'));
}

module.exports = function start(filename, source) {
  // Current rendered object on a screen.
  let json = source

  // Contains map from row number to expand path.
  // Example: {0: '', 1: '.foo', 2: '.foo[0]'}
  let index = new Map()

  // Contains expanded paths. Example: ['', '.foo']
  // Empty string represents root path.
  const expanded = new Set()
  expanded.add('')

  const ttyFd = fs.openSync('/dev/tty', 'r+')
  // Reopen tty
  let ttyReadStream
  let ttyWriteStream
  if (process.platform === 'win32') {
    const cfs = process.binding('fs')
    ttyReadStream = tty.ReadStream(cfs.open('conin$', fs.constants.O_RDWR | fs.constants.O_EXCL, 0o666))
    ttyWriteStream = tty.WriteStream(cfs.open('conout$', fs.constants.O_RDWR | fs.constants.O_EXCL, 0o666))
  } else {
    const ttyFd = fs.openSync('/dev/tty', 'r+')
    ttyReadStream = tty.ReadStream(ttyFd)
    ttyWriteStream = tty.WriteStream(ttyFd)
  }

  const program = blessed.program({
    input: ttyReadStream,
    output: ttyWriteStream,
  })

  const screen = blessed.screen({
    program: program,
    smartCSR: true,
    fullUnicode: true,
  })

  const box = blessed.box({
    parent: screen,
    tags: false,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%-1',
    mouse: true,
    keys: true,
    vi: true,
    ignoreArrows: true,
    alwaysScroll: true,
    scrollable: true,
  })

  const bar = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    height: 1,
    width: '100%',
  })

  box.vars = function() { return { expanded, json } }

  const prompt = blessed.text({
    parent: bar,
    bottom: 0,
    left: 0,
    height: 1,
    width: 8,
    content: 'path:',
  })

  const input = blessed.textbox({
    parent: bar,
    bottom: 0,
    left: 8,
    height: 1,
    width: '100%',
  })

  const autocomplete = blessed.list({
    parent: screen,
    width: 6,
    height: 7,
    left: 1,
    bottom: 1,
    style: config.list,
  })

  box.on('focus', function () {
    if (box.data.searchHit) {
      const { hit, highlight } = box.data.searchHit
      if (hit) {
        expanded.clear()
        expanded.add('')
        hit.route.forEach(h => expanded.add(h))
        render({path:hit.path, highlight})
      }
      else {
        render()
      }
    }
  })

  screen.title = filename
  box.focus()
  autocomplete.hide()
  search.setup({blessed, program, screen, box, source})

  write({screen, box, bar, prompt})

  screen.key(['escape', 'q', 'C-c'], function () {
    program.disableMouse()                // If exit program immediately, stdin may still receive
    setTimeout(() => process.exit(0), 10) // mouse events which will be printed in stdout.
  })

  screen.on('resize', function () {
    render()
  })

  input.on('submit', function () {
    if (autocomplete.hidden) {
      const code = input.getValue()
      apply(code)
    } else {
      // Autocomplete selected
      const code = appendPath(input.getValue(), autocomplete.getSelected())
      input.setValue(code)
      autocomplete.hide()
      update(code)

      // Keep editing code
      input.readInput()
    }
  })

  input.on('cancel', function () {
    if (!autocomplete.hidden) {
      // Autocomplete not selected
      autocomplete.hide()
    }
    box.focus()
    screen.render()
  })

  input.on('update', function (code) {
    update(code)
    complete(code)
  })

  input.key('up', function () {
    if (!autocomplete.hidden) {
      autocomplete.up()
      screen.render()
    }
  })

  input.key('down', function () {
    if (!autocomplete.hidden) {
      autocomplete.down()
      screen.render()
    }
  })

  input.key('C-c', function () {
    input.emit('cancel')
  })

  input.key('C-u', function () {
    input.setValue('')
    autocomplete.hide()
    screen.render()
    update('')
    render()
  })

  input.key('C-w', function () {
    const code = popPath(input.getValue())
    input.setValue(code)
    autocomplete.hide()
    screen.render()
    update(code)
    render()
  })

  box.key('.', function () {
    box.height = '100%-1'
    box.emit('hidesearch')
    if (input.getValue() === '') {
      const [n, line] = getLine(program.y)
      const path = index.get(n)
      input.setValue(path)
      complete(path)
    }
    input.readInput()
    screen.render()
  })

  box.key('e', function () {
    expanded.clear()
    walk(json, path => expanded.size < 1000 && expanded.add(path))
    render()
  })

  box.key('S-e', function () {
    expanded.clear()
    expanded.add('')
    render()

    // Make sure cursor stay on JSON object.
    const [n] = getLine(program.y)
    if (typeof n === 'undefined' || !index.has(n)) {
      // No line under cursor
      let rest = [...index.keys()]
      if (rest.length > 0) {
        const next = Math.max(...rest)
        let y = box.getScreenNumber(next) - box.childBase
        if (y <= 0) {
          y = 0
        }
        const line = box.getScreenLine(y + box.childBase)
        program.cursorPos(y, line.search(/\S/))
      }
    }
  })

  box.key(['up', 'k'], function () {
    program.showCursor()
    let rest = [...index.keys()]

    const [n] = getLine(program.y)
    if (typeof n !== 'undefined') {
      rest = rest.filter(i => i < n)
    }

    if (rest.length > 0) {
      const next = Math.max(...rest)

      let y = box.getScreenNumber(next) - box.childBase
      if (y <= 0) {
        box.scroll(-1)
        screen.render()
        y = 0
      }

      const line = box.getScreenLine(y + box.childBase)
      program.cursorPos(y, line.search(/\S/))
    }

    updatePath()
  })

  box.key(['down', 'j'], function () {
    program.showCursor()
    let rest = [...index.keys()]

    const [n] = getLine(program.y)
    if (typeof n !== 'undefined') {
      rest = rest.filter(i => i > n)
    }

    if (rest.length > 0) {
      const next = Math.min(...rest)

      let y = box.getScreenNumber(next) - box.childBase
      if (y >= box.height) {
        box.scroll(1)
        screen.render()
        y = box.height - 1
      }

      const line = box.getScreenLine(y + box.childBase)
      program.cursorPos(y, line.search(/\S/))
    }
    updatePath()
  })

  box.key(['right', 'l'], function () {
    const [n, line] = getLine(program.y)
    program.showCursor()
    program.cursorPos(program.y, line.search(/\S/))
    const path = index.get(n)
    if (!expanded.has(path)) {
      expanded.add(path)
      render()
    }
    updatePath()
  })

  box.key(['left', 'h'], function () {
    let [n, line] = getLine(program.y)
    let path = index.get(n)
    const val = reduce(json, path)
    if (val == null) {
      path = popPath(path)
    }
    else if (typeof val === 'object' && val.constructor === Object) {
      // if this is already collapsed, go up a level
      if (!expanded.has(path)) {
        path = popPath(path)
      }
    }
    else if (Array.isArray(val)) {
      // if this is already collapsed, go up a level
      if (!expanded.has(path)) {
        path = popPath(path)
      }
    }
    else {
      path = popPath(path)
    }

    expanded.delete(path)
    render({path})
    updatePath()
  })

  box.key(['c'], function () {
    clip.writeSync(input.getValue())
  })

  box.on('click', function (mouse) {
    const [n, line] = getLine(mouse.y)
    if (mouse.x >= stringWidth(line)) {
      return
    }

    program.cursorPos(mouse.y, line.search(/\S/))
    autocomplete.hide()
    screen.render()
    const path = index.get(n)
    if (expanded.has(path)) {
      expanded.delete(path)
    } else {
      expanded.add(path)
    }
    updatePath()

    box.data.searchHit = null
    box.emit('hidesearch')
    box.emit('updatesearchsource', json)

    render()
  })


  function getLine(y) {
    const dy = box.childBase + y
    const n = box.getNumber(dy)
    const line = box.getScreenLine(dy)
    if (typeof line === 'undefined') {
      return [n, '']
    }
    return [n, line]
  }

  box.on('apply', apply)
  function apply() {
    let code = input.getValue()

    if (code && code.length !== 0) {
      code = code.replace(/^\[/, '.[')
      try {
        json = reduce(source, code)
      } catch (e) {
        // pass
      }
    } else {
      box.height = '100%'
      json = source
    }
    box.emit('updatesearchsource', json)
    box.focus()
    program.cursorPos(0, 0)
    render()
  }

  function complete(inputCode) {
    const match = inputCode.match(/\.(\w*)$/)
    const code = /^\.\w*$/.test(inputCode) ? '.' : inputCode.replace(/\.\w*$/, '')

    let json
    try {
      json = reduce(source, code)
      // NOTE: do not emit "updatesearchsource", this `json` is LOCAL scope
    } catch (e) {
    }

    if (match) {
      if (typeof json === 'object' && json.constructor === Object) {
        const keys = Object.keys(json).filter(key => key.startsWith(match[1]))

        // Hide if there is nothing to show or
        // don't show if there is complete match.
        if (keys.length === 0 || (keys.length === 1 && keys[0] === match[1])) {
          autocomplete.hide()
          return
        }

        autocomplete.width = Math.max(...keys.map(key => key.length)) + 1
        autocomplete.height = Math.min(7, keys.length)
        autocomplete.left = Math.min(
          screen.width - autocomplete.width,
          code.length === 1 ? 1 : code.length + 1
        )

        let selectFirst = autocomplete.items.length !== keys.length
        autocomplete.setItems(keys)

        if (selectFirst) {
          autocomplete.select(autocomplete.items.length - 1)
        }
        if (autocomplete.hidden) {
          autocomplete.show()
        }
      } else {
        autocomplete.clearItems()
        autocomplete.hide()
      }
    }
  }

  function update(code) {
    if (code && code.length !== 0) {
      code = code.replace(/^\[/, '.[')
      try {
        const pretender = reduce(source, code)
        if (
          typeof pretender !== 'undefined'
          && typeof pretender !== 'function'
          && !(pretender instanceof RegExp)
        ) {
          json = pretender
        }
      } catch (e) {
        // pass
      }
    }
    if (code === '') {
      json = source
    }
    box.emit('updatesearchsource', json)
    render()
  }

  // `searchInfo` is passed to us via:
  //   - searchInput.on("submit")
  //   - box.on("focus")
  function render(searchInfo = '') {
    const { path, highlight } = searchInfo
    let content
    [content, index] = print(json, {expanded, currentPath:path, highlight})

    if (typeof content === 'undefined') {
      content = 'undefined'
    }

    box.setContent(content)

    if (path) {
      const m = [...index].find(pair => pair[1] === path)
      if (m) {
        let y = box.getScreenNumber(m[0])
        if (--y < 0) y = 0
        const line = box.getLine(m[0])
        box.scrollTo(y)
        program.cursorPos(y - box.childBase + 1, line ? line.search(/\S/) : 0)
      }
    }

    screen.render()
  }

  function updatePath() {
    const [n, line] = getLine(program.y)
    const path = index.get(n)
    input.setValue(path)
    render()
  }

  render()
}
