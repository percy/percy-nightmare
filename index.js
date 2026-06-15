// Collect client and environment information
const sdkPkg = require('./package.json');
const nightmarePkg = require('nightmare/package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const ENV_INFO = `${nightmarePkg.name}/${nightmarePkg.version}`;

// The Percy CLI runs locally and the PercyDOM bundle fetched from its address is
// executed via `new Function` below, so the address must resolve to a loopback
// host. A non-loopback PERCY_SERVER_ADDRESS would turn that fetch+eval into
// remote code execution in the page context (CWE-94 / CWE-918).
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
function isLoopbackAddress(address) {
  try {
    return LOOPBACK_HOSTS.has(new URL(address).hostname.toLowerCase());
  } catch (e) {
    return false;
  }
}

// Take a DOM snapshot and post it to the snapshot endpoint
module.exports = function percySnapshot(name, options) {
  if (!name) throw new Error('The `name` argument is required.');

  return nightmare => {
    let nEval = (fn, ...args) => new Promise((resolve, reject) => {
      let done = (err, res) => err ? reject(err) : resolve(res);
      nightmare.evaluate_now(fn, done, ...args);
    });

    nightmare.queue(async done => {
      let utils = await import('@percy/sdk-utils');

      let log = utils.logger('nightmare');

      // Refuse a non-loopback Percy server address before fetching/executing the
      // PercyDOM bundle from it (the new Function below) — PER-8708 / PER-8717.
      if (utils.percy.address && !isLoopbackAddress(utils.percy.address)) {
        log.error(`Refusing non-loopback PERCY_SERVER_ADDRESS "${utils.percy.address}"; the Percy CLI must run on localhost.`);
        return done();
      }

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
        log.error(`Could not take DOM snapshot "${name}"`);
        log.error(error);
      }

      done();
    });
  };
};
