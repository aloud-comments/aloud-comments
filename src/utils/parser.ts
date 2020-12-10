import scopeCss from '@patarapolw/scope-css'
import DOMPurify from 'dompurify'
import showdown from 'showdown'

export class ShowdownParser {
  mdConverter = new showdown.Converter({
    noHeaderId: true,
    parseImgDimensions: true,
    simplifiedAutoLink: true,
    // literalMidWordUnderscores: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
    simpleLineBreaks: true,
    openLinksInNewWindow: true,
    backslashEscapesHTMLTags: true,
    emoji: true,
    underline: true
  });

  constructor() {
    /**
     * ! For some reasons default underscore italic fails to render...
     */
    this.mdConverter.addExtension({
      type: 'lang',
      regex: /([^\\])_{1}(.*?[^\\])_{1}/g,
      replace: '$1<i>$2</i>'
    }, 'underscore-italic')
  }

  parse (md: string): string {
    const div = document.createElement('div')
    div.id = 'md-' + Math.random().toString(36).substr(2)
    div.innerHTML = this.mdConverter.makeHtml(md)
    div.querySelectorAll('style').forEach(el => {
      el.innerHTML = scopeCss(el.innerHTML, `#${div.id}`)
    })

    const html = div.outerHTML
    div.remove()

    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['style']
    })
  }
}
