// Bundles the official Anthropic SDK into js/vendor/anthropic-sdk.js so the game can
// load it without a build step (web, desktop app and single-file builds).
import { build } from 'esbuild';
await build({
  stdin: { contents: "export { default as Anthropic } from '@anthropic-ai/sdk';", resolveDir: process.cwd() },
  bundle: true, format: 'esm', platform: 'browser', target: 'es2020', minify: true,
  outfile: 'js/vendor/anthropic-sdk.js',
  legalComments: 'eof',
});
console.log('js/vendor/anthropic-sdk.js written');
