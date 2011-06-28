assert = require 'assert'

browserify = require '../'

exports['36'] = ->
  assert.ok browserify(entry: __dirname + '/coffee/entry.coffee')