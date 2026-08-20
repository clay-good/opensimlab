/** Registers the CSS stub hook. Used as `node --import` for the prerender step. */
import { register } from 'node:module';
register('./css-stub.mjs', import.meta.url);
