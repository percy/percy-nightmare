const expect = require('expect');
const Nightmare = require('nightmare');
const helpers = require('@percy/sdk-utils/test/helpers');
const percySnapshot = require('..');

// xvfb wrapper
const xvfb = {
  start: () => new Promise(resolve => {
    xvfb.instance = new (require('xvfb'))();
    xvfb.instance.start(() => resolve());
  }),

  stop: () => new Promise(resolve => {
    xvfb.instance.stop(() => resolve());
  })
};

describe('percySnapshot', () => {
  let nightmare;

  before(async function() {
    this.timeout(0);
    await xvfb.start();
    nightmare = new Nightmare();
    await helpers.mockSite();
  });

  after(async () => {
    await helpers.closeSite();
    await nightmare.end();
    await xvfb.stop();
  });

  beforeEach(async function() {
    this.timeout(0);
    await helpers.setup();
    await nightmare.goto('http://localhost:8000');
  });

  afterEach(async () => {
    await helpers.teardown();
  });

  it('throws an error when a name is not provided', () => {
    expect(() => nightmare.use(percySnapshot()))
      .toThrow('The `name` argument is required.');
  });

  it('disables snapshots when the healthcheck fails', async () => {
    await helpers.testFailure('/percy/healthcheck');

    await nightmare
      .use(percySnapshot('Snapshot 1'))
      .use(percySnapshot('Snapshot 2'));

    await expect(helpers.getRequests()).resolves.toEqual([
      ['/percy/healthcheck']
    ]);

    expect(helpers.logger.stderr).toEqual([]);
    expect(helpers.logger.stdout).toEqual([
      '[percy] Percy is not running, disabling snapshots'
    ]);
  });

  it('posts snapshots to the local percy server', async () => {
    await nightmare
      .use(percySnapshot('Snapshot 1'))
      .use(percySnapshot('Snapshot 2'));

    await expect(helpers.getRequests()).resolves.toEqual([
      ['/percy/healthcheck'],
      ['/percy/dom.js'],
      ['/percy/snapshot', {
        name: 'Snapshot 1',
        url: 'http://localhost:8000/',
        domSnapshot: '<html><head></head><body>Snapshot Me</body></html>',
        clientInfo: expect.stringMatching(/@percy\/nightmare\/.+/),
        environmentInfo: expect.stringMatching(/nightmare\/.+/)
      }],
      ['/percy/snapshot', expect.objectContaining({
        name: 'Snapshot 2'
      })]
    ]);

    expect(helpers.logger.stdout).toEqual([]);
    expect(helpers.logger.stderr).toEqual([]);
  });

  it('handles snapshot failures', async () => {
    await helpers.testFailure('/percy/snapshot', 'failure');

    await nightmare
      .use(percySnapshot('Snapshot 1'));

    expect(helpers.logger.stdout).toEqual([]);
    expect(helpers.logger.stderr).toEqual([
      '[percy] Could not take DOM snapshot "Snapshot 1"',
      '[percy] Error: failure'
    ]);
  });

  it('handles eval errors', async () => {
    await helpers.testSerialize(() => {
      throw new Error('serialize error');
    });

    await nightmare
      .use(percySnapshot('Snapshot 1'));

    expect(helpers.logger.stdout).toEqual([]);
    expect(helpers.logger.stderr).toEqual([
      '[percy] Could not take DOM snapshot "Snapshot 1"',
      '[percy] Error: serialize error'
    ]);
  });
});
