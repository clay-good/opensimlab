/**
 * A module customization hook that makes `import './x.css'` a no-op under Node.
 *
 * The prerender step renders the REAL components so the static markup and the
 * client's first render are the same tree. Those components import their own
 * stylesheets, which the bundler understands and Node does not. Stubbing them
 * here keeps the CSS colocated with the component it styles, rather than
 * hoisting every stylesheet into one entry point to work around the tooling.
 */
export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return { format: 'module', source: 'export default {};', shortCircuit: true };
  }
  return nextLoad(url, context);
}
