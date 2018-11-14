'use strict'

const test = require('tape')
const inject = require('shot').inject
const DelayedResponse = require('./')

test('success', function (t) {
  t.plan(7)

  inject(handler, { url: '/' }).then(function (response) {
    t.equal(response.statusCode, 201)
    t.equal(response.payload, 'boop')
    t.equal(response.headers.foo, 'bar')
  })

  function handler (req, res) {
    const delayed = DelayedResponse(req, res, onResponse)
    delayed.statusCode = 201
    delayed.setHeader('foo', 'bar')
    delayed.end('boop')
  }

  function onResponse (req, res, data, callback) {
    t.equal(req.url, '/')
    t.equal(res.statusCode, 201)
    t.equal(data.toString(), 'boop')
    t.equal(typeof callback, 'function')

    callback()
  }
})

test('writeHead + write', function (t) {
  t.plan(5)

  inject(handler, { url: '/' }).then(function (response) {
    t.equal(response.statusCode, 201)
    t.equal(response.payload, 'boop')
  })

  function handler (req, res) {
    const delayed = DelayedResponse(req, res, onResponse)
    delayed.writeHead(201)
    delayed.write('boop')
    delayed.end()
  }

  function onResponse (req, res, data, callback) {
    t.equal(res.statusCode, 200)
    t.equal(data.toString(), 'boop')
    t.equal(typeof callback, 'function')

    callback()
  }
})

test('error', function (t) {
  t.plan(8)

  inject(handler, { url: '/' }).then(t.fail.bind(t, 'unexpected response'))

  function handler (req, res) {
    const delayed = DelayedResponse(req, res, onResponse)

    delayed.setHeader('foo', 'bar')
    t.equal(delayed.getHeader('foo'), 'bar')

    delayed.removeHeader('foo')
    t.notOk(delayed.getHeader('foo'))
    delayed.setHeader('foo', 'bar')

    delayed.on('error', function (err) {
      t.ok(err)
      t.equal(err.message, 'boom')
      t.notOk(delayed.getHeader('foo'))
    })

    delayed.statusCode = 201
    delayed.write('beep')
    delayed.end('boop')
  }

  function onResponse (req, res, data, callback) {
    t.equal(res.statusCode, 201)
    t.equal(data.toString(), 'beepboop')
    t.equal(typeof callback, 'function')

    callback(new Error('boom'))
  }
})
