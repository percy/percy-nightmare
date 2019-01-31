const httpServer = require('http-server')
const should = require('chai').should()
const Nightmare = require('nightmare')
const { percySnapshot } = require('../dist')
const { agentJsFilename, postSnapshot } = require('@percy/agent')

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

  xdescribe('with local app', function() {
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

    xit('snapshots HTTPS website with no CSP', function(done) {
      nightmare
        .goto('https://www.google.com')
        .use(percySnapshot(this.test.fullTitle(), { widths: [768, 992, 1200] }))
        .catch(done)
        .then(() => done())
        //.then(() => done())
    })

    // As of December 2018, it doesn't seem possible to bypass CSP in Nightmare.
    // See https://github.com/segmentio/nightmare/issues/889 for details.
    // As a consequence, Percy can't take snapshots in Nightmare of live sites with CSP.
    // So the two test cases below do nothing, and are thus disabled.
    xit('snapshots HTTPS website with CSP', function(done) {
      nightmare
        .goto('https://polaris.shopify.com/')
        .use(percySnapshot(this.test.fullTitle(), { widths: [768, 992, 1200] }))
        .then(() => done())
    })

    xit('snapshots site with strict CSP', function(done) {
      nightmare
        .goto('https://buildkite.com/')
        .use(percySnapshot(this.test.fullTitle(), { widths: [768, 992, 1200] }))
        .then(() => done())
    })

    it('csp poc test', function (done) {
      nightmare
        .goto('https://buildkite.com/')
        .inject('js', agentJsFilename())
        .evaluate(function () {
          const percyAgentClient = new PercyAgent({ handleAgentCommunication: false })
          return { domSnapshot: percyAgentClient.snapshot('unused'), url: document.URL }
        })
        .then(function (result) {
          //console.log('### result: ' + JSON.stringify(result))
          //console.log('### url:' + result['url'])
          //console.log('#### domSnapshot: ' + domSnapshot)
          return postSnapshot({
            name: 'test poc snapshot name',
            url: result['url'],
            domSnapshot: result['domSnapshot'],
            clientInfo: 'poc-test'
          })
        })
        .then(() => done())
        .catch(done)
    })
  })
})
