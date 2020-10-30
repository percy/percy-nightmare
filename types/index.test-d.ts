import { expectType, expectError } from 'tsd';
import * as Nightmare from 'nightmare';
import percySnapshot from '.';

declare const nightmare: Nightmare;

expectError(percySnapshot());

expectType<Nightmare>(nightmare.use(percySnapshot('Snapshot name')));
expectType<Nightmare>(nightmare.use(percySnapshot('Snapshot name', { widths: [1000] })));

expectError(nightmare.use(percySnapshot('Snapshot name', { foo: 'bar' })));
