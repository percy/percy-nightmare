import { clientInfo } from './environment'

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
      .inject('js', _agentJsFilepath())
      .evaluate(function (name: string, options: any, clientInfo: string) {
        const percyAgentClient = new PercyAgent({clientInfo})
        percyAgentClient.snapshot(name, options)
      }, name, options, clientInfo())
  }
}

function _agentJsFilepath(): string {
  try {
    return require.resolve('@percy/agent/dist/public/percy-agent.js')
  } catch {
    return 'node_modules/@percy/agent/dist/public/percy-agent.js'
  }
}
