#!/usr/bin/env node
'use strict'
const os = require('os')
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const {stdin, stdout, stderr} = process
const search = require('./search')

try {
  require(path.join(os.homedir(), '.fxrc'))
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err
  }
}
const print = require('./print')
const {reduce} = require('./helpers')

const usage = `
USAGE
    $ fx FILENAME [CODE ...]
    $ fx [CODE ...]
    $ fx [ [ --find | -f ] QUERY ]

EXAMPLES
    $ echo '{"key": "value"}' | fx 'x => x.key'
    value

    $ echo '{"key": "value"}' | fx .key
    value

    $ echo '[1,2,3,4,5,6]' | fx '.map(x => x * 2)' '.filter(x => x % 3 == 0)'
    [6, 12]

    $ echo '{"items": ["one", "two"]}' | fx 'this.items' 'this[1]'
    two

    $ echo '{"count": 0}' | fx '{...this, count: 1}'
    {"count": 1}
`.trim() + '\n'

function main(input, args) {
  let filename = 'fx'
  let exprs = []

  if (input === '') {
    if (args._.length === 0) {
      stderr.write(usage)
      process.exit(1)
    }

    [ filename, ...exprs ] = args._
    input = fs.readFileSync(filename)
    filename = path.basename(filename)
  }
  else {
    exprs = args._
  }

  const json = JSON.parse(input)

  const query = args.find || args.f
  if (query) {
    // output paths to search hits
    const hits = search.find(json, query)
    hits.forEach(function(h) {
      console.log(h.path)
    })
    return
  }

  if (exprs.length === 0 && stdout.isTTY) {
    // interactive mode
    require('./fx')(filename, json)
    return
  }

  // reduce the json by running each expression against it
  const output = exprs.reduce(reduce, json)
  if (typeof output === 'undefined') {
    stderr.write('undefined\n')
  } else if (typeof output === 'string') {
    console.log(output)
  } else {
    const [text] = print(output)
    console.log(text)
  }
}

function run() {
  let args = minimist(process.argv.slice(2))
  if (args.h || args.help) {
    stdout.write(usage)
    return
  }

  stdin.setEncoding('utf8')

  if (stdin.isTTY) {
    main('', args)
    return
  }

  let buff = ''
  stdin.on('readable', () => {
    let chunk

    while ((chunk = stdin.read())) {
      buff += chunk
    }
  })

  stdin.on('end', () => {
    main(buff, args)
  })
}

run()
