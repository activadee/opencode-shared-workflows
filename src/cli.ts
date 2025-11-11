#!/usr/bin/env node
import { createProgram } from './program';
import { logger } from './lib/logger';

const program = createProgram();

program
  .parseAsync(process.argv)
  .catch((error) => {
    logger.fatal(error);
    process.exit(1);
  });
