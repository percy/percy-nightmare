const httpServer = require('http-server')
const should = require('chai').should()
const Nightmare = require('nightmare')
const { percySnapshot } = require('../dist')

describe('@percy/nightmare SDK', function() {
  this.timeout('10s')

  const PORT = 8000
  const TEST_URL = `http://localhost:${PORT}`


  // The HTTP server that hosts our test app.
  let server = null

  // The Nightmare instance we'll use for testing.
  let nightmare = null

  before(function() {
    // Start local server for the app under test.
    server = httpServer.createServer({ root: `${__dirname}/testapp` })
    server.listen(PORT)

    // Create a new Nightmare instance
    nightmare = new Nightmare({
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true,
        allowDisplayingInsecureContent: true
      },
      switches: { 'ignore-certificate-errors': true },
    })
  })

  after(function(done) {
    // Shutdown server.
    server.close()

    // End the Nightmare instance
    nightmare.end(done)
  })

  describe('with local app', function() {
    beforeEach(function(done) {
      nightmare
        .goto(TEST_URL)
        .evaluate(() => localStorage.clear())
        .then(() => done())
    })

    it('snapshots with provided name', function(done) {
      nightmare.use(percySnapshot(this.test.fullTitle())).then(() => done())
    })

    it('snapshots with provided name and widths', function(done) {
      nightmare
        .use(percySnapshot(this.test.fullTitle(), { widths: [768, 992, 1200] }))
        .then(() => done())
    })

    it('snapshots with provided name and minHeight', function(done) {
      nightmare
        .use(percySnapshot(this.test.fullTitle(), { minHeight: 2000 }))
        .then(() => done())
    })

    it('snapshots with provided name and percyCSS', function(done) {
      nightmare
        .use(percySnapshot(this.test.fullTitle(), {
          percyCSS: `body { background-color: purple; }`
        }))
        .then(() => done())
    })

    it('takes multiple snapshots in one test', function(done) {
      nightmare
        .type('.new-todo', 'A thing to accomplish')
        .use(
          percySnapshot(`${this.test.fullTitle()} - #1`, {
            widths: [768, 992, 1200],
          })
        )
        .then(() => {
          return nightmare.click('input.toggle').use(
            percySnapshot(`${this.test.fullTitle()} - #2`, {
              widths: [768, 992, 1200],
            })
          )
        })
        .then(() => done())
    })
  })

  describe('with live sites', function() {
    it('snapshots a website with HTTP', function(done) {
      nightmare
        .goto('http://example.com/')
        .use(percySnapshot(this.test.fullTitle()))
        .then(() => done())
    })

    it('snapshots a website with HTTPS, strict CSP, CORS and HSTS setup', function(done) {
      nightmare
        .goto('https://sdk-test.percy.dev')
        .use(percySnapshot(this.test.fullTitle()))
        .then(() => done())
    })
  })
})
