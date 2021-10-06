import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';
import replace from "@rollup/plugin-replace";

require("dotenv").config()

const production = !process.env.ROLLUP_WATCH;

console.log('Is this production?', production);

if (production) {
  console.log('The SERVER is:', process.env.PROD_SERVER);
}

if (!production) {
  console.log('The SERVER is:', process.env.DEV_SERVER);
}

const timestamp = new Date()
  .toLocaleString()
  .replace(" ", "")
  .replace(/:/g, "")
  .replace(/\//g, "")
  .replace(/,/g, "");
//const bundleName = `bundle-${timestamp}.js`;
const bundleName = `bundle-map`;
const bundleNameDebug = "bundle";

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn(
        'npm',
        ['run', 'start', '--', '--dev'],
        {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
        }
      );

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    },
  };
}

export default {
  input: 'src/main.ts',
  output: {
    sourcemap: !production,
    format: 'iife',
    name: 'app',
    file: production
    ? `public/build/${bundleName}.js`
    : `public/build/${bundleNameDebug}.js`,
  compact: production,
  },
  plugins: [
    !production &&
    replace({
      __APPNAME__: "EMSX",
      __VERSION__: "0.0.1",
      __SERVER__: process.env.DEV_SERVER,
      __PORT__: process.env.DEV_PORT,
      __SCHEMA__: process.env.DEV_SCHEMA,
      preventAssignment: true,
    }),
  production &&
    replace({
      __APPNAME__: "EMSX",
      __VERSION__: "0.0.1",
      __SERVER__: process.env.PROD_SERVER,
      __PORT__: "",
      __SCHEMA__: process.env.PROD_SCHEMA,
      preventAssignment: true,
    }),
    svelte({
      preprocess: sveltePreprocess({
        sourceMap: !production,
        postcss: {
          plugins: [require("tailwindcss"), require("autoprefixer")],
        },
      }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({
      output: production ? `${bundleName}.css` : `${bundleNameDebug}.css`,
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs({
      include: ["/node_modules/**"],
    }),
    typescript({
      tsconfig: production ? "./tsconfig.prod.json" : "./tsconfig.json",
      sourceMap: !production,
      inlineSources: !production,
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
