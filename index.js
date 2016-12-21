'use strict'

const inherits = require('util').inherits
const http = require('http')
const toBuffer = require('to-buffer')

module.exports = DelayedResponse

function DelayedResponse (req, res, callback) {
  if (!(this instanceof DelayedResponse)) {
    return new DelayedResponse(req, res, callback)
  }

  this.req = req
  this.res = res
  this.callback = callback

  this.buffer = []
  this.queue = []
  http.ServerResponse.call(this, {
    method: req.method,
    httpVersionMajor: 1,
    httpVersionMinor: 1
  })
}

inherits(DelayedResponse, http.ServerResponse)

DelayedResponse.prototype.getHeader = function getHeader () {
  return this.res.getHeader.apply(this.res, arguments)
}

DelayedResponse.prototype.setHeader = function setHeader () {
  this.queue.push(['setHeader', arguments])
  return this.res.setHeader.apply(this.res, arguments)
}

DelayedResponse.prototype.removeHeader = function removeHeader () {
  return this.res.removeHeader.apply(this.res, arguments)
}

DelayedResponse.prototype.writeHead = function writeHead () {
  this.queue.push(['writeHead', arguments])
}

DelayedResponse.prototype.write = function write (chunk) {
  this.buffer.push(chunk)
  this.queue.push(['write', arguments])
}

DelayedResponse.prototype.end = function end (chunk) {
  if (chunk) this.buffer.push(chunk)
  this.queue.push(['end', arguments])
  flush(this)
}

function flush (self) {
  const data = Buffer.concat(self.buffer.map(toBuffer))
  const res = self.res
  self.buffer = null

  self.callback(self.req, self, data, done)

  function done (err) {
    if (err) {
      while (self.queue.length) {
        const call = self.queue.shift()
        if (call[0] === 'setHeader') {
          res.removeHeader(call[1][0])
        }
      }

      return self.emit('error', err)
    }

    res.statusCode = self.statusCode

    while (self.queue.length) {
      const call = self.queue.shift()
      if (call[0] === 'setHeader') continue
      res[call[0]].apply(res, call[1])
    }
  }
}
