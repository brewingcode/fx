'use strict'
const fs = require('fs')
const blessed = require('@medv/blessed')
const print = require('./print')

function setup(options = {}) {
  const { screen, box, bar, prompt } = options

  const filename = blessed.textbox({
    parent: bar,
    bottom: 0,
    left: 8,
    height: 1,
    width: '100%',
  })

  box.key('w', function () {
    prompt.setContent('output:')
    bar.show()
    filename.show()
    filename.setValue('')
    filename.readInput()
    box.emit('hidesearch')
    screen.render()
  })

  filename.key('C-c', function () {
    filename.emit('cancel')
  })

  filename.key('C-u', function () {
    filename.setValue('')
    filename.readInput()
    screen.render()
  })

  filename.on('cancel', function () {
    prompt.setContent('filter:')
    filename.hide()
    bar.hide()
    box.emit('apply')
  })

  filename.on('finished', function () {
    prompt.setContent('filter:')
    filename.setValue('')
    bar.hide()
    box.emit('apply')
  })

  filename.on('submit', function () {
    if (!filename.getValue()) {
      filename.emit('finished')
      return
    }

    const { json, expanded } = box.vars()
    let [text] = print(json, {expanded, noFormat:true})
    fs.writeFile(filename.getValue(), text, (err) => {
      if (err) {
        filename.setValue(err.message)
        screen.render()
        setTimeout(function() {
          filename.emit('cancel')
        }, 2000)
      }
      else {
        filename.setValue(`wrote ${text.length} chars to ${filename.getValue()}`)
        screen.render()
        setTimeout(function() {
          filename.emit('finished')
        }, 2000)
      }
    })
  })
}

module.exports = setup
