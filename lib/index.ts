import { clientInfo } from './environment'
import { agentJsFilename, isAgentRunning, postSnapshot } from '@percy/agent'

declare var PercyAgent: any;

/**
 * A function to take a Percy snapshot from a NightmareJS test. To use in your tests:
 *   const { percySnapshot } = require('@percy/nightmare')
 *   [...]
 *   nightmare
 *     .goto(<yourtesturl>)
 *     .use(percySnapshot(<your snapshot name>), <maybe options>))
 *
 * @param name Name of the snapshot that we're taking. Required.
 * @param options Additional options, e.g. '{widths: [300, 600, 1000]}'. Optional.
 */
export function percySnapshot(name: string, options: any = {}) {
  if (!name) {
    throw new Error("'name' must be provided. In Mocha, this.test.fullTitle() is a good default.")
  }
  return function (nightmare: any) {
    nightmare
      .inject('js', agentJsFilename())
      .queue(function (done: any) {
        isAgentRunning()
          .then(function(isRunning: boolean) {
            if (isRunning) {
              return _post_snapshot(nightmare, name, options, clientInfo())
            } else {
              console.log('[percy] agent not running -- skipping snapshots')
              return Promise.resolve(true)
            }
          })
          .then(() => done())
          .catch(done)
      })
  }
}

function _post_snapshot(nightmare: any, name: string, options: any, clientInfo: string) {
  // Turn call to nightmare.evaluate_now(...) into a Promise, for ease of chaining.
  return new Promise(function (resolve, reject) {
    // Use evaluate_now instead of evaluate because it allows us to pass a callback and retrieve
    // the result without having to call .then(...) or .run(...), which would initiate running the
    // entire Nightmare chain.
    nightmare.evaluate_now(function (name: string, options: any = {}, clientInfo: string) {
      const percyAgentClient = new PercyAgent({ handleAgentCommunication: false })
      return {
        domSnapshot: percyAgentClient.snapshot('unused'),
        url: document.URL,
        name,
        options,
        clientInfo
      }
    }, function (err: any, result: any) {
      if (err) return reject(err)
      return postSnapshot({
        name: result['name'],
        url: result['url'],
        domSnapshot: result['domSnapshot'],
        clientInfo: result['clientInfo'],
        ...result['options']
      }).then(resolve).catch(reject)
    }, name, options, clientInfo)
  })
}
