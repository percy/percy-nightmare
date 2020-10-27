const utils = require('@percy/sdk-utils');

// Collect client and environment information
const sdkPkg = require('./package.json');
const nightmarePkg = require('nightmare/package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const ENV_INFO = `${nightmarePkg.name}/${nightmarePkg.version}`;

// Take a DOM snapshot and post it to the snapshot endpoint
module.exports = function percySnapshot(name, options) {
  if (!name) throw new Error('The `name` argument is required.');

  return nightmare => {
    let nEval = (fn, ...args) => new Promise((resolve, reject) => {
      let done = (err, res) => err ? reject(err) : resolve(res);
      nightmare.evaluate_now(fn, done, ...args);
    });

    nightmare.queue(async done => {
      if (!(await utils.isPercyEnabled())) return done();

      try {
        // Inject the DOM serialization script
        /* eslint-disable-next-line no-new-func */
        await nEval(new Function(await utils.fetchPercyDOM()));

        // Serialize and capture the DOM
        /* istanbul ignore next: no instrumenting injected code */
        let { domSnapshot, url } = await nEval(options => ({
          /* eslint-disable-next-line no-undef */
          domSnapshot: PercyDOM.serialize(options),
          url: document.URL
        }), options);

        // Post the DOM to the snapshot endpoint with snapshot options and other info
        await utils.postSnapshot({
          ...options,
          environmentInfo: ENV_INFO,
          clientInfo: CLIENT_INFO,
          domSnapshot,
          url,
          name
        });
      } catch (error) {
        // Handle errors
        utils.log('error', `Could not take DOM snapshot "${name}"`);
        utils.log('error', error);
      }

      done();
    });
  };
};
