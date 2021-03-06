'use strict'
const fs = require('fs')
const config = require('./config')

function walk(v, cb, path = '', paths = []) {
  if (!v) {
    return
  }

  paths.push(path)

  if (Array.isArray(v)) {
    cb(path, v, paths.slice())
    let i = 0
    for (let item of v) {
      walk(item, cb, path + '[' + (i++) + ']', paths)
    }
  }
  else if (typeof v === 'object' && v.constructor === Object) {
    cb(path, v, paths.slice())
    for (let [key, value] of Object.entries(v)) {
      walk(value, cb, appendPath(path, key), paths)
    }
  }
  else {
    cb(path, v, paths.slice())
  }

  paths.pop()
}

function reduce(json, code) {
  const m = code ? code.match(/^\.?(\[.*)/) : null
  if (m) {
    const fx = eval(`function fn() {
      return ${'this' + m[1]}
    }; fn`)
    return fx.call(json)
  }

  if (/^\./.test(code)) {
    const fx = eval(`function fn() { 
      return ${code === '.' ? 'this' : 'this' + code} 
    }; fn`)
    return fx.call(json)
  }

  if (/yield\*?\s/.test(code)) {
    const fx = eval(`function fn() {
      const gen = (function*(){ 
        ${code.replace(/\\\n/g, '')} 
      }).call(this)
      return [...gen]
      }; fn`)
    return fx.call(json)
  }

  const fx = eval(`function fn() { 
    return ${code} 
  }; fn`)

  const fn = fx.call(json)
  if (typeof fn === 'function') {
    return fn(json)
  }
  return fn
}

// pop() the last bit off the path
function popPath(path) {
  path = path ? path.replace(/[\.\[][^\.\[]*$/, '') : '.'
  return path === '' ? '.' : path
}

// append() to a path
function appendPath(path, next) {
  if (/^(\.|this)$/.test(path)) {
    path = ''
  }
  if (/\s/.test(next) || /^\d/.test(next)) {
    return path + `["${next}"]`
  }
  else {
    return path.replace(/\.*$/,  '.' + next)
  }
}

module.exports = { walk, reduce, popPath, appendPath }
