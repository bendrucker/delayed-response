# delayed-response [![Build Status](https://travis-ci.org/bendrucker/delayed-response.svg?branch=master)](https://travis-ci.org/bendrucker/delayed-response)

> Buffer an HTTP response and execute a function before flushing


## Install

```
$ npm install --save delayed-response
```


## Usage

```js
var DelayedResponse = require('delayed-response')

server.on('request', function (req, res) {
  var delayed = DelayedResponse(req, res, print)
  delayed.statusCode = 201

  fs.createReadStream('data.txt')
    .pipe(delayed)
    .on('error', function (err) {
      res.statusCode = 500
      res.end(err.message)  
    })
})

function print (delayed, data, callback) {
  console.log(data.toString())
  callback()
}
```

## API

#### `DelayedResponse(req, res, callback)` -> `object`

Returns a `delayed` instance which proxies an [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse). Delayed responses emit errors returned from the supplied `callback`. Make sure to handle the `'error'` event on your response or use an abstraction like [pump](https://github.com/mafintosh/pump).  

##### req

*Required*  
Type: `object`

An [`http.IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage).

##### res

*Required*  
Type: `object`

The original [`http.ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse).

##### callback

*Required*  
Type: `function`  
Arguments: `req, delayed, buffer, done`

A callback to call with the delayed response, the full data buffer (a `Buffer`), and a `done` function. Passing an error to `done` will cause the delayed request to reset the original response headers and then emit an error. Otherwise, the buffered data is re-sent.


## License

MIT © [Ben Drucker](http://bendrucker.me)
