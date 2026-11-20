import { parseEnv } from './config/env-parser.js';
import type { Env } from './config/env-schema.js';

export const env: Env = parseEnv();
