import { Component, Element, Prop, State, h } from '@stencil/core'
import { HTMLStencilElement, Watch } from '@stencil/core/internal'
import * as firebaseui from 'firebaseui'

import { EntryViewer, initEntryViewer } from '../../base/EntryViewer'
import { IApi, IAuthor, IPost } from '../../types'
import { isBgDark } from '../../utils/color'
import { FakeAPI } from '../../utils/faker'
import { ShowdownParser } from '../../utils/parser'

declare global {
  interface Window {
    /**
     * Firebase will be attached to window Object, if not exists.
     */
    firebase: typeof import('firebase/app').default;
    /**
     * ```html
     * <script
     *   src="https://cdnjs.cloudflare.com/ajax/libs/Faker/3.1.0/faker.min.js"
     *   crossorigin="anonymous"
     * ></script>
     * ```
     */
    faker: typeof import('faker');
    /**
     * ```html
     * <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
     * ```
     */
    Dexie: typeof import('dexie') & import('dexie').DexieConstructor;
    /**
     * ```html
     * <script src="https://unpkg.com/txtgen"></script>
     * ```
     */
    txtgen: typeof import('txtgen');
    /**
     * Only attached to window in Debug mode.
     */
    isBgDark: (bgColor?: string) => boolean;
  }
}

@Component({
  tag: 'aloud-comments',
  styleUrl: 'aloud-comments.scss',
  shadow: true
})
export class AloudComments implements EntryViewer {
  /**
   * URL to be used for the database
   */
  @Prop() url = location.href
    .replace(/#[^/].*$/, '')
    .replace(/#\/$/, '')
    .replace(/\/$/, '');

  /**
   * CodeMirror theme
   */
  @Prop() cmTheme = 'default';

  /**
   * Custom `firebaseui.auth.AuthUI` object
   */
  @Prop({
    mutable: true,
    reflect: true
  })
  firebaseUiConfig: firebaseui.auth.Config;

  /**
   * API configuration
   */
  @Prop({
    mutable: true,
    reflect: true
  })
  api!: IApi;

  /**
   * Custom markdown parser
   */
  @Prop({
    mutable: true,
    reflect: true
  })
  parser: {
    parse: (md: string) => string;
  };

  /**
   * Number of children to load by default
   */
  @Prop() maxChildrenAllowed = 3;

  /**
   * Whether to generate random entries
   *
   * Requires `faker` to be installed.
   */
  @Prop() debug = false;

  /**
   * Allows theme to be set and updated
   */
  @Prop() theme?: 'dark' | 'light';

  @State() user?: IAuthor;
  @State() children: IPost[] = [];
  @State() hasMore = true;
  @State() isSmallScreen = false;
  @State() mainEditorValue = '';
  @State() isImageHovered = false;

  @Element() $el: HTMLElement;

  firebaseUI: firebaseui.auth.AuthUI;

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;

  get limit (): number {
    return this.maxChildrenAllowed
  }

  constructor () {
    initEntryViewer(this)
  }

  async componentWillLoad (): Promise<void> {
    const mq = matchMedia('(max-width: 600px)')

    if (
      mq.matches
      || /(Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini)/i.test(
        navigator.userAgent
      )
    ) {
      this.isSmallScreen = true
    }

    mq.onchange = evt => {
      this.isSmallScreen = evt.matches
    }

    if (this.debug) {
      (async () => {
        /**
         * These are required.
         *
         * ```js
         * window.faker
         * window.Dexie
         * window.txtgen
         * ```
         *
         * And, this will be generated.
         *
         * ```js
         * window.isBgDark
         * ```
         */
        window.isBgDark = isBgDark

        const api = await FakeAPI.create(['/', '#/spa1', '#/spa2'])
        this.api = api
        this.user = api.user
      })()
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.firebase
      = window.firebase || (await import('firebase/app').then(r => r.default))

    this.firebaseUI = new firebaseui.auth.AuthUI(window.firebase.auth())

    this.parser = this.parser || new ShowdownParser()

    this.doLoad(true)
  }

  @Watch('theme')
  onThemeChanged (): void {
    if (!(this.theme === 'dark' || this.theme === 'light')) {
      this.theme = isBgDark() ? 'dark' : 'light'
    }

    this.$el.style.setProperty('--c-bg', `var(--c-${this.theme}-bg)`)
    this.$el.style.setProperty('--c-font', `var(--c-${this.theme}-font)`)
    this.$el.style.setProperty('--c-link', `var(--c-${this.theme}-link)`)
    this.$el.style.setProperty('--c-button', `var(--c-${this.theme}-button)`)
  }

  @Watch('api')
  @Watch('url')
  onPropStateChanged (): void {
    this.children = []
    this.doLoad(true)
  }

  render (): HTMLStencilElement {
    return (
      <main
        class={this.theme}
        onClick={ev => {
          if (
            ev
              .composedPath()
              .some(
                el =>
                  el instanceof HTMLElement && /(^| )popup/.test(el.className)
              )
          ) {
            return
          }
          this.isImageHovered = false
        }}
      >
        <article class="media mb-4">
          <figure class="media-left">
            <p
              class="image is-64x64 popup-container"
              onClick={() => (this.isImageHovered = true)}
            >
              {this.isImageHovered ? (
                this.user ? (
                  <div
                    class="popup"
                    onMouseLeave={() => (this.isImageHovered = false)}
                  >
                    <button class="button is-danger" style={{ margin: '1rem' }}>
                      Click to logout
                    </button>
                  </div>
                ) : (
                  <div
                    class="popup"
                    style={{ width: '300px' }}
                    ref={r => {
                      setTimeout(async () => {
                        if (!r) {
                          return
                        }

                        r.textContent = ''

                        this.firebaseUI.start(
                          r,
                          this.firebaseUiConfig || {
                            signInOptions: [
                              window.firebase.auth.GoogleAuthProvider
                                .PROVIDER_ID,
                              window.firebase.auth.EmailAuthProvider
                                .PROVIDER_ID,
                              firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
                            ],
                            popupMode: true
                          }
                        )
                      }, 100)
                    }}
                    onMouseLeave={() => (this.isImageHovered = false)}
                  />
                )
              ) : null}
              {this.user ? (
                <img
                  src={this.user.image}
                  alt={this.user.name}
                  title={`${this.user.name} - Click to logout`}
                />
              ) : (
                <img
                  src="https://www.gravatar.com/avatar?d=mp"
                  title="Click to login"
                />
              )}
            </p>
          </figure>
          <div class="media-content">
            <div class="field">
              <p class="control">
                <aloud-editor
                  parser={this.parser}
                  theme={this.cmTheme}
                  onCmChange={ev => (this.mainEditorValue = ev.detail.value)}
                />
              </p>
            </div>
            <nav>
              <button
                class="button is-info"
                type="button"
                onClick={async () => {
                  await this.api
                    .post({
                      url: this.url,
                      authorId: this.user.id,
                      markdown: this.mainEditorValue
                    })
                    .then(({ entryId }) => {
                      this.children = [
                        {
                          url: this.url,
                          parentId: null,
                          id: entryId,
                          author: this.user,
                          markdown: this.mainEditorValue,
                          isDeleted: false,
                          createdAt: new Date(),
                          like: [],
                          dislike: [],
                          bookmark: []
                        },
                        ...this.children
                      ]
                    })

                  this.mainEditorValue = ''
                }}
              >
                Submit
              </button>
            </nav>
          </div>
        </article>

        {this.children.map(it => (
          <aloud-entry
            url={this.url}
            key={it.id}
            parser={this.parser}
            user={this.user}
            entry={it}
            api={this.api}
            isSmallScreen={this.isSmallScreen}
            depth={1}
            cmTheme={this.cmTheme}
            onDelete={evt => this.doDelete(evt.detail)}
          ></aloud-entry>
        ))}

        {this.hasMore ? (
          <button class="more" type="button" onClick={() => this.doLoad(true)}>
            Click for more
          </button>
        ) : null}
      </main>
    )
  }
}
