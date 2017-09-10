'use strict'

var express = require('express')
var app = express()

app.disable('etag')
app.disable('x-powered-by')

app.use(require('cors')())
app.use(require('dns-prefetch-control')())
app.use(require('frameguard')())
app.use(require('hide-powered-by')())
app.use(require('hsts')())
app.use(require('ienoopen')())
app.use(require('x-xss-protection')())

app.get('/', function (req, res) {
  res.json({ hello: 'world' })
})

app.listen(3000)
