import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'

import {
  EntryViewer,
  IPostChange,
  initEntryViewer
} from '../../base/EntryViewer'
import { IApi, IAuthor, IPost } from '../../types/base'
import { isBgDark } from '../../utils/color'
import { DexieAPI } from '../../utils/dexie'
import { FirebaseAPI } from '../../utils/firebase'
import { ShowdownParser } from '../../utils/parser'

declare global {
  interface Window {
    /**
     * Firebase will be attached to window Object, if not exists.
     */
    firebase: typeof import('firebase/app').default;
    /**
     * ```html
     * <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
     * ```
     */
    Dexie: typeof import('dexie') & import('dexie').DexieConstructor;
    /**
     * Only attached to window in Debug mode.
     */
    isBgDark: (bgColor?: string) => boolean;
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
     * <script src="https://unpkg.com/txtgen"></script>
     * ```
     */
    txtgen: typeof import('txtgen');
  }

  interface LinkHTMLAttributes {
    crossOrigin: string;
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
   *
   * Comma-separated
   */
  @Prop() debug?: string;

  /**
   * Allows theme to be set and updated
   */
  @Prop({
    mutable: true
  })
  theme: 'dark' | 'light' = 'light';

  @Element() $el: HTMLElement;

  isVisible = true;
  visibleObserver: IntersectionObserver;

  @State() user?: IAuthor;
  @State() children: IPost[] = [];
  @State() mainEditorValue = '';
  @State() hasMore = true;
  @State() isSmallScreen = false;
  @State() isImageHovered = false;
  @State() isLoading = true;
  @State() realtimeUpdates: IPostChange[] = [];

  firebaseUI: firebaseui.auth.AuthUI;

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;

  doOnRealtimeChange: () => Promise<void>;

  get limit (): number {
    return this.maxChildrenAllowed
  }

  async componentWillLoad (): Promise<void> {
    initEntryViewer(this, this.$el)

    {
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
    }

    const trySetTheme = (colorScheme: 'dark' | 'light') => {
      if (matchMedia(`(prefers-color-scheme: ${colorScheme})`).matches) {
        this.theme = colorScheme
      }
    }

    trySetTheme('light')
    trySetTheme('dark')

    matchMedia('(prefers-color-scheme: dark)')

    let isFirebase = false
    const setUser = async (u: import('firebase').default.User) => {
      if (u) {
        this.user = await this.api.getAuthor(u.email)
        if (!this.user) {
          this.user = await this.api.addAuthor({
            name: u.displayName,
            image: u.photoURL,
            id: u.email
          })
        }
      } else {
        this.user = null
      }
    }

    try {
      /**
       * Both firebase and firebaseui must come from the same source.
       *
       * Either both NPM, or both web.
       *
       * @see https://github.com/firebase/firebaseui-web/issues/536
       */
      // if (window.firebase) {
      //   window.firebaseui
      //     = window.firebaseui
      //     || (await import(
      //       'https://www.gstatic.com/firebasejs/ui/4.7.1/firebase-ui-auth.js'
      //     ))
      // } else {
      //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //   // @ts-ignore
      //   window.firebase = await import('firebase/app').then(r => r.default)
      //   window.firebaseui = _firebaseui
      // }

      isFirebase = true

      this.firebaseUI = new window.firebaseui.auth.AuthUI(
        window.firebase.auth()
      )

      window.firebase.auth().onAuthStateChanged(u => {
        setUser(u)
      })
    } catch (e) {
      console.error(e)
    }

    if (this.debug) {
      window.isBgDark = isBgDark;
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
        if (isFirebase) {
          const api = new FirebaseAPI({
            faker: window.faker,
            txtgen: window.txtgen
          })

          /**
           * Attach API early, because it is realtime
           */
          this.api = api

          // api
          //   .queryPosts({
          //     parentId: ''
          //   })
          //   .onSnapshot(s => {
          //     this.realtimeUpdates = s.docChanges().map(r => ({
          //       ...r,
          //       id: r.doc.id,
          //       data: r.doc.data()
          //     }))
          //     this.doOnRealtimeChange()
          //   })

          /**
           * To populate firebase, you will need
           *
           * ```
           * allow write, delete: if true;
           * ```
           */
          await api
            .populateDebug(this.debug.split(','))
            .catch(e => console.error(e))
        } else {
          const api = new DexieAPI({
            faker: window.faker,
            txtgen: window.txtgen
          })

          await api
            .populateDebug(this.debug.split(','))
            .catch(e => console.error(e))

          /**
           * Attach API late, because it is not realtime, and only you
           */
          this.api = api

          setTimeout(() => {
            this.user = this.user || api.firstAuthor
          }, 50)
        }
      })()
    } else {
      const api = new FirebaseAPI({
        faker: window.faker,
        txtgen: window.txtgen
      })
      this.api = api
    }

    try {
      setUser(window.firebase.auth().currentUser)
    } catch (e) {
      console.error(e)
    }

    this.parser = this.parser || new ShowdownParser()
  }

  @Watch('api')
  @Watch('url')
  onApiOrUrlChanged (): void {
    this.isLoading = false
    this.children = []
    this.doLoad(true)
  }

  render (): HTMLStencilElement {
    return (
      <Host>
        <base href="/" />
        <link
          type="text/css"
          rel="stylesheet"
          href="https://www.gstatic.com/firebasejs/ui/4.7.1/firebase-ui-auth.css"
        />
        {
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.1/css/bulma.min.css"
            integrity="sha512-ZRv40llEogRmoWgZwnsqke3HNzJ0kiI0+pcMgiz2bxO6Ew1DVBtWjVn0qjrXdT3+u+pSN36gLgmJiiQ3cQtyzA=="
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            crossOrigin="anonymous"
          />
        }

        <main
          data-theme={this.theme}
          onClick={ev => {
            if (
              ev
                .composedPath()
                .some(
                  el =>
                    el instanceof HTMLElement
                    && /(^| )popup/.test(el.className)
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
                <div
                  class="popup"
                  style={{
                    visibility:
                      this.user && this.isImageHovered ? 'visible' : 'hidden'
                  }}
                  onMouseLeave={() => (this.isImageHovered = false)}
                >
                  <button
                    class="button is-danger"
                    style={{ margin: '1rem' }}
                    onClick={() => {
                      window.firebase.auth().signOut()
                    }}
                  >
                    Click to logout
                  </button>
                </div>

                <div
                  class="popup"
                  style={{
                    left:
                      !this.user && this.isImageHovered ? 'initial' : '-1000px',
                    width: '300px'
                  }}
                  ref={r => {
                    setTimeout(async () => {
                      if (!r || !this.firebaseUI) {
                        return
                      }

                      this.firebaseUI.start(
                        r,
                        this.firebaseUiConfig || {
                          signInOptions: [
                            window.firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                            window.firebase.auth.EmailAuthProvider.PROVIDER_ID,
                            window.firebaseui.auth.AnonymousAuthProvider
                              .PROVIDER_ID
                          ],
                          signInFlow: 'popup',
                          callbacks: {
                            signInSuccessWithAuthResult: authResult => {
                              console.log(authResult)
                              return true
                            },
                            signInFailure: async error => {
                              // Some unrecoverable error occurred during sign-in.
                              // Return a promise when error handling is completed and FirebaseUI
                              // will reset, clearing any UI. This commonly occurs for error code
                              // 'firebaseui/anonymous-upgrade-merge-conflict' when merge conflict
                              // occurs. Check below for more details on this.
                              console.error(error)
                            }
                          }
                        }
                      )
                    }, 100)
                  }}
                  onMouseLeave={() => (this.isImageHovered = false)}
                />

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
                            createdAt: +new Date(),
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
              realtimeUpdates={this.realtimeUpdates}
              onDelete={evt => this.doDelete(evt.detail)}
            />
          ))}

          {this.isLoading ? (
            <div class="inTurnFadingTextG">
              <div>-</div>
              <div>-</div>
              <div>&nbsp;</div>
              <div>L</div>
              <div>o</div>
              <div>a</div>
              <div>d</div>
              <div>i</div>
              <div>n</div>
              <div>g</div>
              <div>&nbsp;</div>
              <div>-</div>
              <div>-</div>
            </div>
          ) : null}

          {!this.isLoading && this.hasMore ? (
            <button
              class="more"
              type="button"
              onClick={() => this.doLoad(true)}
            >
              Click for more
            </button>
          ) : null}
        </main>
      </Host>
    )
  }
}
