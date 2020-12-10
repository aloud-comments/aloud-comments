// @ts-check

(function () {
  const aloud = document.querySelector('aloud-comments')
  /**
   * @type {number}
   */
  let setAloudTimer

  /**
   *
   * @param {string} t
   */
  function setAloudTheme (t) {
    window.clearTimeout(setAloudTimer)

    // @ts-ignore
    if (!window.isBgDark) {
      setAloudTimer = window.setTimeout(() => {
        setAloudTheme(t)
      }, 50)

      return
    }

    const darkMap = {
      white: false,
      gondola: true,
      mischka: false,
      'big-stone': true,
      black: true,
      tasman: false,
      'pastel-pink': false,
      'pearl-lusta': false
    }

    // @ts-ignore
    if (typeof darkMap[t] === 'undefined' ? isBgDark() : darkMap[t]) {
      console.log(t, 'Changing to dark')
      aloud.setAttribute('theme', 'dark')
    } else {
      console.log(t, 'Changing to light')
      aloud.setAttribute('theme', 'light')
    }
  }

  /**
   * @type {HTMLLinkElement[]}
   */
  const themeElements = Array.from(
    document.querySelectorAll('link[rel="stylesheet"][data-theme]')
  )

  let prefersColorScheme = localStorage.getItem('prefers-color-scheme')

  if (!prefersColorScheme) {
    const themeEl = matchMedia('(prefers-color-scheme: dark)').matches
      ? themeElements.find(el => el.getAttribute('data-theme') === 'black')
      : themeElements.find(el => el.getAttribute('data-theme') === 'white')
    if (themeEl) {
      prefersColorScheme = themeEl.getAttribute('data-theme')
    }
  }

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
    sel.value = t

    let themeEl = themeElements.find(el => el.media === '')

    if (!themeEl) {
      themeEl = /** @type {HTMLLinkElement} */ (themeElements[0].cloneNode())
      themeEl.removeAttribute('media')
      themeEl.removeAttribute('data-theme')

      document.head.append(themeEl)

      themeElements.push(themeEl)
    }

    themeEl.href = `https://unpkg.com/awsm.css/dist/awsm_theme_${t}.min.css`

    prefersColorScheme = t
    localStorage.setItem('prefers-color-scheme', t)

    setAloudTheme(t)
  }

  sel.onchange = () => {
    setMainTheme(sel.value)
  }

  setMainTheme(prefersColorScheme)

  /**
   * @type {HTMLButtonElement}
   */
  const toggleEl = document.querySelector('button.scheme-toggle')

  toggleEl.onclick = () => {
    // @ts-ignore
    if (isBgDark()) {
      setMainTheme('white')
    } else {
      setMainTheme('black')
    }
  }
})()
