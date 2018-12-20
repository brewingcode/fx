'use strict'
const test = require('ava')
const {execSync} = require('child_process')
const { appendPath, popPath } = require('./helpers')

function fx(json, code = '') {
  return execSync(`echo '${JSON.stringify(json)}' | node index.js ${code}`).toString('utf8')
}

test('pass', t => {
  const r = fx([{"greeting": "hello world"}])
  t.deepEqual(JSON.parse(r), [{"greeting": "hello world"}])
})

test('anon func', t => {
  const r = fx({"key": "value"}, "'function (x) { return x.key }'")
  t.is(r, 'value\n')
})

test('arrow func', t => {
  const r = fx({"key": "value"}, "'x => x.key'")
  t.is(r, 'value\n')
})

test('arrow func ()', t => {
  const r = fx({"key": "value"}, "'(x) => x.key'")
  t.is(r, 'value\n')
})

test('this bind', t => {
  const r = fx([1, 2, 3, 4, 5], "'this.map(x => x * this.length)'")
  t.deepEqual(JSON.parse(r), [5, 10, 15, 20, 25])
})

test('generator', t => {
  const r = fx([1, 2, 3, 4, 5], "'for (let i of this) if (i % 2 == 0) yield i'")
  t.deepEqual(JSON.parse(r), [2, 4])
})

test('chain', t => {
  const r = fx({"items": ["foo", "bar"]}, "'this.items' 'yield* this' 'x => x[1]'")
  t.is(r, 'bar\n')
})

test('search', t => {
  const json = [
    "foo",
    "bar",
    {
      "this": {
        "that": [ 3, 4, "BAR" ]
      }
    }
  ]
  let r = fx(json, '--find bar')
  t.is(r, '[1]\n')

  r = fx(json, '--find /bar/i')
  t.is(r, '[1]\n[2].this.that[2]\n')
})

test('appendPath', t => {
  t.is('.', appendPath('', ''))
  t.is('.foo', appendPath('', 'foo'))
  t.is('.foo', appendPath('.', 'foo'))
  t.is('.foo.bar', appendPath('.foo', 'bar'))
  t.is('.foo["white space"]', appendPath('.foo', 'white space'))
  t.is('.foo', appendPath('this', 'foo'))
})

test('popPath', t => {
  t.is('.', popPath('.foo'))
  t.is('.', popPath('.white space'))
  t.is('.', popPath('.["white space"]'))
})
