import dts from 'rollup-plugin-dts';

export default {
  input: 'client/app.ts',
  output: {
    file: 'app.d.ts',
    format: 'es'
  },
  external: ['client/test.js', 'client/components/test.js', 'client/pages/test.js'],
  plugins: [dts({ respectExternal: true })]
};