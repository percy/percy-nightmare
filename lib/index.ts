import { clientInfo } from './environment'

declare var PercyAgent: any;
declare var Nightmare: any;

/**
 * A function to take a Percy snapshot from a NightmareJS test. To use in your tests:
 *   const { percySnapshot } = require('@percy/nightmare')
 *   [...]
 *   nightmare
 *     .goto(<yourtesturl>)
 *     .use(percySnapshot(<your snapshot name>), <maybe options>))
 *
 * @param name Name of the snapshot that we're taking.
 * @param options Additional options, e.g. '{widths: [300, 600, 1000]}'. Optional.
 */
export function percySnapshot(name: string, options: any = {}) {
  const percyClientInfo: string =  clientInfo()
  return function (nightmare: any) {
    nightmare
      .inject('js', 'node_modules/@percy/nightmare/node_modules/@percy/agent/dist/public/percy-agent.js')
      .evaluate(function (name: string, options: any, percyClientInfo: string) {
        name = name || document.title
        const percyAgentClient = new PercyAgent({
          clientInfo: percyClientInfo
        })
        percyAgentClient.snapshot(name, options)
      }, name, options, percyClientInfo)
  }
}
