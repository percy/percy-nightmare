import { SnapshotOptions } from '@percy/core';
import * as Nightmare from 'nightmare';

export default function percySnapshot(
  name: string,
  options?: SnapshotOptions
): (nightmare: Nightmare) => void;
