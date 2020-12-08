import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'

export const config: Config = {
  namespace: 'aloud-comments',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader'
    },
    {
      type: 'dist-custom-elements-bundle'
    },
    {
      type: 'docs-readme'
    },
    {
      type: 'www',
      copy: [{ src: '../demo/js', dest: 'js' }],
      serviceWorker: null // disable service workers
    }
  ],
  plugins: [sass()]
}
