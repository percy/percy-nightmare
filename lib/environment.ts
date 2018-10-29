export function clientInfo(): string {
  const version = require('../package.json').version
  const name = require('../package.json').name
  return `${name}/${version}`
}
