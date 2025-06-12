const { parse } = require('url')
const express = require('express')
const a = express()
// const { promises as fs, existsSync } = require('fs')
const fs = require('fs')

const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3333;
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  a.get('/api/config', async (rq, rs) => {
    const path = process.cwd() + '/config.json';
    if (!existsSync(path)) {
      res.status(400).json({ error: 'config not found' })
      handle(rq, rs)
      return;
    }
    const file = fs.readFileSync(path, 'utf8');
    const config = JSON.parse(file)
    res.send(config)
    handle(rq, rs)
    return;
  })
  a.get('*', (req, res) => {
    const parsedUrl = parse(req.url, true)
    const { pathname, query } = parsedUrl

    if (pathname === '/a') {
      app.render(req, res, '/a', query)
    } else if (pathname === '/b') {
      app.render(req, res, '/b', query)
    } else {
      handle(req, res, parsedUrl)
    }
  })
  a.listen(port)
  // createServer((req, res) => {
  //   // Be sure to pass `true` as the second argument to `url.parse`.
  //   // This tells it to parse the query portion of the URL.
  //   const parsedUrl = parse(req.url, true)
  //   const { pathname, query } = parsedUrl

  //   if (pathname === '/a') {
  //     app.render(req, res, '/a', query)
  //   } else if (pathname === '/b') {
  //     app.render(req, res, '/b', query)
  //   } else {
  //     handle(req, res, parsedUrl)
  //   }
  // }).listen(port, (err) => {
  //   if (err) throw err
  //   console.log(`> Ready on http://localhost:${port}`)
  // })
})