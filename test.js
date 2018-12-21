'use strict'
const test = require('ava')
const {execSync} = require('child_process')
const { walk, appendPath, popPath } = require('./helpers')

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

test('examples', t => {
  t.is(fx({key:'value'}, "'x => x.key'"), 'value\n')
  t.is(fx({key:'value'}, '.key'), 'value\n')
  t.deepEqual(JSON.parse(fx([1,2,3,4,5,6], "'.map(x => x * 2)' '.filter(x => x % 3 == 0)'")), [6, 12])
  t.is(fx({items: ['one', 'two']}, "'this.items' 'this[1]'"), 'two\n')
  t.deepEqual(JSON.parse(fx({count: 0}, "'{...this, count: 1}'")), {count: 1})
})

test('walk', t => {
  const callbacks = []
  walk({a:1, b:[2,3,4], c:{d:"e", f:"g"}}, function(path, v, paths) {
    // throw out v, no need to log/compare it as part of the test
    callbacks.push([path, paths])
  })
  t.deepEqual(callbacks, [
    [ '',      [ '' ]                ],
    [ '.a',    [ '', '.a' ]          ],
    [ '.b',    [ '', '.b' ]          ],
    [ '.b[0]', [ '', '.b', '.b[0]' ] ],
    [ '.b[1]', [ '', '.b', '.b[1]' ] ],
    [ '.b[2]', [ '', '.b', '.b[2]' ] ],
    [ '.c',    [ '', '.c' ]          ],
    [ '.c.d',  [ '', '.c', '.c.d' ]  ],
    [ '.c.f',  [ '', '.c', '.c.f' ]  ]
  ])
})
