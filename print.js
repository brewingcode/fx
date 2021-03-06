'use strict'
const indent = require('indent-string')
const config = require('./config')
const { appendPath } = require('./helpers')

function format(value, style, highlightStyle, regexp, transform = x => x) {
  if (!regexp) {
    return style(transform(value))
  }
  const marked = value
    .replace(regexp, s => '<highlight>' + s + '<highlight>')

  return transform(marked)
    .split(/<highlight>/g)
    .map((s, i) => i % 2 !== 0 ? highlightStyle(s) : style(s))
    .join('')
}

function print(input, options = {}) {
  const {expanded, highlight, currentPath, noFormat} = options
  const index = new Map()
  let row = 0

  function doPrint(v, path = '') {
    index.set(row, path)

    // Code for highlighting parts become cumbersome.
    // Maybe we should refactor this part.
    const highlightStyle = (currentPath === path) ? config.highlightCurrent : config.highlight
    const formatStyle = (v, style) => {
      return noFormat
        ? JSON.stringify(v)
        : format(JSON.stringify(v), style, highlightStyle, highlight)
    }
    const formatText = (v, style, path) => {
      if (noFormat) {
        return JSON.stringify(v)
      }
      else {
        const highlightStyle = (currentPath === path) ? config.highlightCurrent : config.highlight
        return format(v, style, highlightStyle, highlight, JSON.stringify)
      }
    }

    const eol = () => {
      row++
      return '\n'
    }

    if (typeof v === 'undefined') {
      return void 0
    }

    if (v === null) {
      return formatStyle(v, config.null)
    }

    if (typeof v === 'number' && Number.isFinite(v)) {
      return formatStyle(v, config.number)
    }

    if (typeof v === 'boolean') {
      return formatStyle(v, config.boolean)

    }

    if (typeof v === 'string') {
      return formatText(v, config.string, path)
    }

    if (Array.isArray(v)) {
      let output = config.bracket('[')
      const len = v.length

      if (len > 0) {
        if (expanded && !expanded.has(path)) {
          output += ` ${v.length} `
        } else {
          output += eol()
          let i = 0
          for (let item of v) {
            const value = typeof item === 'undefined' ? null : item // JSON.stringify compatibility
            output += indent(doPrint(value, path + '[' + i + ']'), config.space)
            output += i++ < len - 1 ? config.comma(',') : ''
            output += eol()
          }
        }
      }

      return output + config.bracket(']')
    }

    if (typeof v === 'object' && v.constructor === Object) {
      let output = config.bracket('{')

      const entries = Object.entries(v).filter(([key, value]) => typeof value !== 'undefined') // JSON.stringify compatibility
      const len = entries.length

      if (len > 0) {
        if (expanded && !expanded.has(path)) {
          output += ` ${Object.entries(v).length} `
        } else {
          output += eol()
          let i = 0
          for (let [key, value] of entries) {
            const newPath = appendPath(path, key)
            const part = formatText(key, config.key, newPath) + config.colon(':') + ' ' + doPrint(value, newPath)
            output += indent(part, config.space)
            output += i++ < len - 1 ? config.comma(',') : ''
            output += eol()
          }
        }
      }

      return output + config.bracket('}')
    }

    return JSON.stringify(v, null, config.space)
  }

  return [doPrint(input), index]
}

module.exports = print
