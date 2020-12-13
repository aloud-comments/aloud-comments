// @ts-check

(function () {
  const aloud = document.querySelector('aloud-comments')

  /**
   *
   * @param {HashChangeEvent} ev
   */
  window.onhashchange = ev => {
    aloud.setAttribute(
      'url',
      ev.newURL
        .replace(/#[^/].*$/, '')
        .replace(/#\/$/, '')
        .replace(/\/$/, '')
    )
  }
})()
