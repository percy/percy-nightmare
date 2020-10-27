const expect = require('expect');
const Nightmare = require('nightmare');
const sdk = require('@percy/sdk-utils/test/helper');
const percySnapshot = require('..');

describe('percySnapshot', () => {
  let nightmare;

  before(async function() {
    this.timeout(0);
    nightmare = new Nightmare();
    await sdk.testsite.mock();
  });

  after(async () => {
    await sdk.testsite.close();
    await nightmare.end();
  });

  beforeEach(async () => {
    await sdk.setup();
    await nightmare.goto('http://localhost:8000');
  });

  afterEach(async () => {
    await sdk.teardown();
  });

  it('throws an error when a name is not provided', () => {
    expect(() => nightmare.use(percySnapshot()))
      .toThrow('The `name` argument is required.');
  });

  it('disables snapshots when the healthcheck fails', async () => {
    sdk.test.failure('/percy/healthcheck');

    await sdk.stdio(async () => {
      await nightmare
        .use(percySnapshot('Snapshot 1'))
        .use(percySnapshot('Snapshot 2'));
    });

    expect(sdk.server.requests).toEqual([
      ['/percy/healthcheck']
    ]);

    expect(sdk.stdio[2]).toEqual([]);
    expect(sdk.stdio[1]).toEqual([
      '[percy] Percy is not running, disabling snapshots\n'
    ]);
  });

  it('posts snapshots to the local percy server', async () => {
    await sdk.stdio(async () => {
      await nightmare
        .use(percySnapshot('Snapshot 1'))
        .use(percySnapshot('Snapshot 2'));
    });

    expect(sdk.server.requests).toEqual([
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

    expect(sdk.stdio[2]).toEqual([]);
  });

  it('handles snapshot failures', async () => {
    sdk.test.failure('/percy/snapshot', 'failure');

    await sdk.stdio(async () => {
      await nightmare
        .use(percySnapshot('Snapshot 1'));
    });

    expect(sdk.stdio[1]).toHaveLength(0);
    expect(sdk.stdio[2]).toEqual([
      '[percy] Could not take DOM snapshot "Snapshot 1"\n',
      '[percy] Error: failure\n'
    ]);
  });

  it('handles eval errors', async () => {
    sdk.serializeDOM = () => {
      throw new Error('serialize error');
    };

    await sdk.stdio(async () => {
      await nightmare
        .use(percySnapshot('Snapshot 1'));
    });

    expect(sdk.stdio[1]).toHaveLength(0);
    expect(sdk.stdio[2]).toEqual([
      '[percy] Could not take DOM snapshot "Snapshot 1"\n',
      '[percy] Error: serialize error\n'
    ]);
  });
});
