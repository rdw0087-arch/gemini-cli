#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as url from 'node:url';
import * as path from 'node:path';
import { constants } from 'node:os';

import * as pendo from 'pendo-server-sdk';

import { logger } from '../utils/logger.js';
import { main } from './app.js';

async function shutdownPendo(signal: NodeJS.Signals) {
  await pendo.shutdown();
  process.exit(128 + constants.signals[signal]);
}

// Check if the module is the main script being run
const isMainModule =
  path.basename(process.argv[1]) ===
  path.basename(url.fileURLToPath(import.meta.url));

if (
  import.meta.url.startsWith('file:') &&
  isMainModule &&
  process.env['NODE_ENV'] !== 'test'
) {
  process.on('uncaughtException', (error) => {
    logger.error('Unhandled exception:', error);
    process.exit(1);
  });

  process.on('SIGINT', () => void shutdownPendo('SIGINT'));
  process.on('SIGTERM', () => void shutdownPendo('SIGTERM'));

  main()
    .then(() => {
      // Initialised after main() has loaded the config, which starts the Gemini
      // CLI OpenTelemetry SDK when telemetry is enabled, so Pendo attaches to
      // that tracer provider instead of replacing it.
      pendo.init({
        apiKey: '6db60b1e-6723-4757-b546-34cf44bc54ec',
        agentId: 'NJRioSkKJrBNV52wluB-fnGJCtY',
        endpoint: 'https://app.pendo.io',
        autoPatch: true,
      });
    })
    .catch((error) => {
      logger.error('[CoreAgent] Unhandled error in main:', error);
      process.exit(1);
    });
}
