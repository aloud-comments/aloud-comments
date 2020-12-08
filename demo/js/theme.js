// @ts-check

(function () {
  const aloud = document.querySelector('aloud-comments')

  let prefersColorScheme
    = localStorage.getItem('prefers-color-scheme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'white')
  localStorage.setItem('prefers-color-scheme', prefersColorScheme)

  /**
   * @type {HTMLSelectElement}
   */
  const sel = document.querySelector('select[name="theme-switch"]')

  /**
   * @type {HTMLLinkElement[]}
   */
  const linkTheme = Array.from(document.querySelectorAll('link.theme'))

  /**
   *
   * @param {'black' | 'white'} t
   */
  const setMainTheme = t => {
    linkTheme.slice(1).map(el => el.remove())

    linkTheme.map(el => {
      el.media = ''
      el.href = `https://unpkg.com/awsm.css/dist/awsm_theme_${t}.min.css`
    })

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

  setMainTheme(/** @type {'black' | 'white'} */ (prefersColorScheme))
  setAloudTheme(localStorage.getItem('aloud-theme') || prefersColorScheme)

  /**
   * @type {HTMLButtonElement}
   */
  const toggleEl = document.querySelector('button.scheme-toggle')

  toggleEl.onclick = () => {
    setMainTheme(prefersColorScheme === 'black' ? 'white' : 'black')
  }
})()
