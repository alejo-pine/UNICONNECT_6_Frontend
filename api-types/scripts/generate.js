const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const openapiPath = '../../../../Backend_uniconnect_6/UNICONNECT_6_Backend/social-service/docs/openapi.json';
const outTypes = 'src/api.types.ts';
const outZod = 'src/api.zod.ts';

console.log('Generating TypeScript types from OpenAPI...');
try {
  execSync(`npx openapi-typescript "${openapiPath}" -o "${outTypes}"`, { stdio: 'inherit' });
  console.log('✅ TypeScript types generated successfully!');

  console.log('Generating Zod schemas from OpenAPI...');
  execSync(`npx openapi-zod-client "${openapiPath}" -o "${outZod}"`, { stdio: 'inherit' });
  console.log('✅ Zod schemas generated successfully!');
} catch (e) {
  console.error('❌ Error generating types:', e.message);
  process.exit(1);
}

// Generate an index.ts to export everything
const indexPath = path.resolve(__dirname, '../src/index.ts');
fs.writeFileSync(indexPath, `export * from './api.types';\nexport * from './api.zod';\n`);
console.log('✅ Index file generated successfully!');
