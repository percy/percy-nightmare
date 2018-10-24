export function clientInfo(): string {
  let version = require('../package.json').version
  let name = require('../package.json').name
  return `${name}/${version}`
}
