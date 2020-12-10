import { Component, Element, Prop, State, h } from '@stencil/core'
import { HTMLStencilElement, Watch } from '@stencil/core/internal'
import firebaseui from 'firebaseui'

import { EntryViewer, initEntryViewer } from '../../base/EntryViewer'
import { IApi, IAuthor, IFirebaseConfig, IPost } from '../../types'
import { isBgDark } from '../../utils/color'
import { FakeAPI } from '../../utils/faker'
import { ShowdownParser } from '../../utils/parser'

declare global {
  /**
   * Only append to window Object in Debug mode.
   */
  interface Window {
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
   * Firebase configuration. Will be `JSON.parse()`
   *
   * Requires either string version in HTML or Object version in JSX
   */
  @Prop({
    attribute: 'firebase'
  })
  _firebase: string;

  /**
   * Firebase configuration
   *
   * Actually is nullable in Debug mode.
   */
  @Prop({
    mutable: true
  })
  firebase!: IFirebaseConfig;

  /**
   * Custom `firebaseui.auth.AuthUI` object
   */
  @Prop({
    mutable: true,
    reflect: true
  })
  firebaseui?: firebaseui.auth.AuthUI;

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

  @Element() $el: HTMLElement;

  mainEditor: HTMLAloudEditorElement;

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;

  get limit (): number {
    return this.maxChildrenAllowed
  }

  constructor () {
    initEntryViewer(this)
  }

  componentWillLoad (): void {
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
    } else {
      this.firebase = this.firebase || JSON.parse(this._firebase)
    }

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
      <main>
        <article class="media mb-4">
          <figure class="media-left">
            <p class="image is-64x64">
              {this.user ? (
                <img
                  src={this.user.image}
                  alt={this.user.name}
                  title={this.user.name}
                />
              ) : (
                <img src="https://www.gravatar.com/avatar?d=mp" />
              )}
            </p>
          </figure>
          <div class="media-content">
            <div class="field">
              <p class="control">
                <aloud-editor
                  parser={this.parser}
                  firebase={this.firebase}
                  theme={this.cmTheme}
                  onCmChange={ev => this.mainEditorValue = ev.detail.value}
                  ref={el => {
                    this.mainEditor = el
                  }}
                />
              </p>
            </div>
            <nav class="level">
              <div class="level-left">
                <div class="level-item">
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
                </div>
              </div>
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
            firebase={this.firebase}
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
