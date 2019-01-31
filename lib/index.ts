import { clientInfo } from './environment'
import { agentJsFilename, isAgentRunning, postSnapshot } from '@percy/agent'
import { doesNotReject } from 'assert';

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
      .evaluate(function (name: string, options: any = {}, clientInfo: string) {
        const percyAgentClient = new PercyAgent({ handleAgentCommunication: false })
        return {
          domSnapshot: percyAgentClient.snapshot('unused'),
          url: document.URL,
          name,
          options,
          clientInfo
          }
      }, name, options, clientInfo())
      .then(function (result: any) {
        //console.log('#### result: ' + JSON.stringify(result))
        //console.log('### about to post snapshot')
        return postSnapshot({
          name: result['name'],
          url: result['url'],
          domSnapshot: result['domSnapshot'],
          clientInfo: result['clientInfo'],
          ...result['options']
        })
      })
  }
}
