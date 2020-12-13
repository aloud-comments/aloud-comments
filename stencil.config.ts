import { Config } from '@stencil/core'
import { execSync } from 'child_process'
import { sass } from '@stencil/sass'

execSync(/* shell */ `
cp -fr www/js firebase-app/public || true
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
      copy: [{ src: '../firebase-app/public/js', dest: 'js' }],
      serviceWorker: null // disable service workers
    }
  ],
  plugins: [sass()]
}
