import { execSync } from 'child_process'

import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'

execSync(/* shell */ `
cp -r www/aloud-comments/js ./demo
`)

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
      copy: [
        { src: '../demo/js', dest: 'js' },
        { src: '../demo/root.html', dest: '../index.html' }
      ],
      serviceWorker: null, // disable service workers
      baseUrl: 'https://aloud-comments.github.io/aloud-comments/'
    }
  ],
  plugins: [sass()]
}
