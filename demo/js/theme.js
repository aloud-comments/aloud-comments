// @ts-check

(function () {
  const aloud = document.querySelector('aloud-comments')

  /**
   * @type {{ scheme: string; href: string; }[]}
   */
  const colorSchemes = []

  document
    .querySelectorAll('link[rel="stylesheet"][data-theme]')
    .forEach(el => {
      colorSchemes.push({
        scheme: el.getAttribute('data-theme'),
        href: el.getAttribute('href')
      })
    })

  let prefersColorScheme
    = localStorage.getItem('prefers-color-scheme')
    || (matchMedia('(prefers-color-scheme: dark)').matches
      ? colorSchemes.find(el => el.scheme === 'black')
      : colorSchemes.find(el => el.scheme === 'white')
    )?.scheme
  localStorage.setItem('prefers-color-scheme', prefersColorScheme)

  /**
   * @type {HTMLSelectElement}
   */
  const sel = document.querySelector('select[name="theme-switch"]')

  /**
   *
   * @param {string} t
   */
  const setMainTheme = t => {
    /**
     * @type {HTMLLinkElement[]}
     */
    const linkTheme = Array.from(
      document.querySelectorAll('link[rel="stylesheet"][data-theme]')
    )

    linkTheme.slice(1).map(el => el.remove())
    linkTheme[0].media = ''
    linkTheme[0].href
      = colorSchemes.find(el => el.scheme === t)?.href || linkTheme[0].href

    prefersColorScheme = t
    localStorage.setItem('prefers-color-scheme', t)
  }

  /**
   *
   * @param {string} t
   */
  const setAloudTheme = t => {
    sel.value = t
    localStorage.setItem('aloud-theme', t)
    aloud.setAttribute('theme', t)
  }

  sel.onchange = () => {
    setAloudTheme(sel.value)
  }

  setMainTheme(prefersColorScheme)
  setAloudTheme(
    localStorage.getItem('aloud-theme')
      || colorSchemes.find(el => el.scheme === prefersColorScheme)?.scheme
  )

  /**
   * @type {HTMLButtonElement}
   */
  const toggleEl = document.querySelector('button.scheme-toggle')

  toggleEl.onclick = () => {
    let i = colorSchemes.findIndex(el => el.scheme === prefersColorScheme) + 1
    if (i >= colorSchemes.length) {
      i = 0
    }

    if (colorSchemes[i].scheme) {
      setMainTheme(colorSchemes[i].scheme)
    }
  }
})()
