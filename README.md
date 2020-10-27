# @percy/nightmare

[![Version](https://img.shields.io/npm/v/@percy/nightmare.svg)](https://www.npmjs.com/package/@percy/nightmare)
![Test](https://github.com/percy/percy-nightmare/workflows/Test/badge.svg)

[Percy](https://percy.io) visual testing for [Nightmare](https://www.nightmarejs.org).

## Installation

Using yarn:

```sh-session
$ yarn add --dev @percy/cli @percy/nightmare@next
```

Using npm:

```sh-session
$ npm install --save-dev @percy/cli @percy/nightmare@next
```

## Usage

This is an example using the `percySnapshot` function.

```javascript
const Nightmare = require('nightmare');
const percySnapshot = require('@percy/nightmare);

Nightmare()
  .goto('http://example.com')
  //... other actions ...
  .use(percySnapshot('Example Snapshot'))
  //... more actions ...
  .end()
  .then(() => {
    // ...
  })
```

Running the code above directly will result in the following logs:

```sh-session
$ node script.js
[percy] Percy is not running, disabling snapshots
```

When running with [`percy
exec`](https://github.com/percy/cli/tree/master/packages/cli-exec#percy-exec), and your project's
`PERCY_TOKEN`, a new Percy build will be created and snapshots will be uploaded to your project.

```sh-session
$ export PERCY_TOKEN=[your-project-token]
$ percy exec -- node script.js
[percy] Percy has started!
[percy] Created build #1: https://percy.io/[your-project]
[percy] Running "node script.js"
[percy] Snapshot taken "Example Snapshot"
[percy] Stopping percy...
[percy] Finalized build #1: https://percy.io/[your-project]
[percy] Done!
```

## Configuration

`percySnapshot(name[, options])`

- `name` (**required**) - The snapshot name; must be unique to each snapshot
- `options` - Additional snapshot options (overrides any project options)
  - `options.widths` - An array of widths to take screenshots at
  - `options.minHeight` - The minimum viewport height to take screenshots at
  - `options.percyCSS` - Percy specific CSS only applied in Percy's rendering environment
  - `options.requestHeaders` - Headers that should be used during asset discovery
  - `options.enableJavaScript` - Enable JavaScript in Percy's rendering environment

## Upgrading

If you're coming from a pre-2.0 version of this package, make sure to install `@percy/cli` after
upgrading to retain any existing scripts that reference the Percy CLI command.

Using yarn:

```sh-session
$ yarn add --dev @percy/cli
```

Using npm:

```sh-session
$ npm install --save-dev @percy/cli
```

### Migrating Config

If you have a previous Percy configuration file, migrate it to the newest version with the
[`config:migrate`](https://github.com/percy/cli/tree/master/packages/cli-config#percy-configmigrate-filepath-output) command:

```sh-session
$ percy config:migrate
```
