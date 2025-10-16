import fs from 'fs';
import path from 'path';
import YAML from 'yamljs';
import { OpenAPIV3 } from 'openapi-types';

const swaggerFileCandidates = [
  path.resolve(__dirname, '..', 'docs', 'openapi.yaml'),
  path.resolve(__dirname, '..', '..', 'src', 'docs', 'openapi.yaml'),
  path.resolve(process.cwd(), 'src', 'docs', 'openapi.yaml')
];

const swaggerFilePath = swaggerFileCandidates.find((candidate) => fs.existsSync(candidate));

if (!swaggerFilePath) {
  throw new Error('Unable to locate OpenAPI specification file (openapi.yaml).');
}

export const swaggerDocument = YAML.load(swaggerFilePath) as OpenAPIV3.Document;

export const swaggerOptions = {
  customSiteTitle: 'VLEI KERIA API Docs',
  customfavIcon: 'https://swagger.io/favicon-32x32.png',
  customCss: '.topbar { display: none }'
};
