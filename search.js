'use strict'
const fs = require('fs')
const { walk, appendPath } = require('./helpers')

function setup(options = {}) {
  const { blessed, program, screen, box } = options
  let { source } = options

  const searchPrompt = blessed.text({
    parent: screen,
    bottom: 0,
    left: 0,
    height: 1,
    width: 8,
    content: 'search:',
  })

  const searchInput = blessed.textbox({
    parent: screen,
    bottom: 0,
    left: 8,
    height: 1,
    width: '100%',
  })

  let boxLine = -1
  let hits = []
  let hitIndex = 0
  let highlight = null

  function backToBox() {
    if (hits.length) {
      // render to the line of our current hit
      const hit = hits[hitIndex]
      searchInput.setValue(`${hitIndex + 1} of ${hits.length} found: ${hit.path}`)
      box.data.searchHit = { hit, highlight }
    }
    else {
      // render a clean view
      const line = box.getScreenLine(box.childBase + boxLine)
      program.cursorPos(boxLine, line ? line.search(/\S/) : 0)
      box.data.searchHit = { hit: null, highlight: null }
    }
    program.showCursor()
    screen.render()
    box.focus()
  }

  box.key('/', function () {
    boxLine = program.y
    box.height = '100%-1'
    searchPrompt.show()
    searchInput.show()
    searchInput.setValue('')
    searchInput.readInput()
    screen.render()
  })

  box.key('n', function () {
    if (hitIndex + 1 <= hits.length - 1) {
      hitIndex++
    }
    backToBox()
  })

  box.key('p', function () {
    // todo: "N" would be prefereable, but `box.key('N', ...)` does not hook into "N" keypresses
    if (hitIndex - 1 >= 0) {
      hitIndex--
    }
    backToBox()
  })

  searchInput.on('submit', function () {
    box.height = '100%-1'
    const query = searchInput.getValue()
    if (query) {
      hits = find(source, query)
      hitIndex = 0
      highlight = str2regex(query)
      if (hits.length === 0) {
        searchInput.setContent('no hits found')
      }
    }
    else {
      hide()
    }
    backToBox()
  })

  function hide() {
    box.height = '100%'
    searchPrompt.hide()
    searchInput.hide()
    screen.render()
  }
  searchInput.on('cancel', hide)
  box.on('hidesearch', hide)

  searchInput.key('C-u', function () {
    searchInput.setValue('')
    screen.render()
  })

  searchInput.key('C-c', function () {
    searchInput.emit('cancel')
  })

  box.on('updatesearchsource', function(json) {
    source = json
  })

  searchPrompt.hide()
  searchInput.hide()
}

function str2regex(s) {
  const m = s.match(/^\/(.*)\/([gimuy]*)$/)
  return m
   ? RegExp(m[1], m[2])
   : RegExp(s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')) // https://stackoverflow.com/a/3561711/2926055
}

function find(source, query) {
  if (/^\s*$/.test(query)) {
    return []
  }

  const regex = str2regex(query)
  const hits = []

  walk(source, function(path, v, paths) {
    if (typeof v === 'object' && v.constructor === Object) {
      // walk already passes us `path` for:
      //   - scalars
      //   - array elements
      //   - object VALUES
      // ...but not object KEYS, which we have to check ourselves
      for (let [key, value] of Object.entries(v)) {
        if (regex.test(key)) {
          path = appendPath(path, key)
          paths.push(path)
          hits.push({ path, route:paths })
        }
      }
    }
    else if (typeof v === 'string' && regex.test(v)) {
      hits.push({ path, route:paths })
    }
  })

  return hits
}

module.exports = { setup, find }
