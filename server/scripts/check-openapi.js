import fs from 'fs/promises';
import path from 'path';
import SwaggerParser from '@apidevtools/swagger-parser';
import { fileURLToPath } from 'url';
import openapi from '../docs/openapi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDirectory = path.resolve(__dirname, '../routes');
const routeFiles = [
  'authRoutes.js',
  'freelancerRoutes.js',
  'projectRoutes.js',
  'applicationRoutes.js',
  'adminRoutes.js',
  'chatRoutes.js',
];

const routePattern = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g;
const documentedOperations = new Set(
  Object.entries(openapi.paths).flatMap(([routePath, item]) => Object.keys(item)
    .filter((method) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
    .map((method) => `${method.toUpperCase()} ${routePath}`)),
);

const registeredOperations = new Set(['GET /', 'GET /health/live', 'GET /health/ready']);
for (const routeFile of routeFiles) {
  const source = await fs.readFile(path.join(routesDirectory, routeFile), 'utf8');
  for (const match of source.matchAll(routePattern)) {
    registeredOperations.add(`${match[1].toUpperCase()} ${match[2].replace(/:([A-Za-z0-9_]+)/g, '{$1}')}`);
  }
}

await SwaggerParser.validate(openapi);

const undocumented = [...registeredOperations].filter((operation) => !documentedOperations.has(operation));
const stale = [...documentedOperations].filter((operation) => !registeredOperations.has(operation));

if (undocumented.length || stale.length) {
  if (undocumented.length) console.error(`Undocumented registered operations:\n${undocumented.join('\n')}`);
  if (stale.length) console.error(`Documented operations not registered by route files:\n${stale.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`OpenAPI 3.1 document is valid and covers ${registeredOperations.size} registered HTTP operations.`);
}
