import { Component, Host, Prop, State, h } from '@stencil/core'
import { HTMLStencilElement, Watch } from '@stencil/core/internal'
import firebaseui from 'firebaseui'

import { EntryViewer, initEntryViewer } from '../../base/EntryViewer'
import { IApi, IAuthor, IFirebaseConfig, IPost } from '../../types'
import { FakeAPI } from '../../utils/faker'
import { ShowdownParser } from '../../utils/parser'

declare global {
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
   * Color theme based on awsm.css
   */
  @Prop({
    mutable: true,
    reflect: true
  })
  theme = matchMedia('(prefers-color-scheme: dark)').matches
    ? 'black'
    : 'white';

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

  @State() user?: IAuthor;
  @State() children: IPost[] = [];
  @State() hasMore = true;
  @State() isSmallScreen = false;

  mainEditor: HTMLAloudEditorElement;

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;

  get limit (): number {
    return this.maxChildrenAllowed
  }

  get themeUrl (): string {
    if (this.theme.includes('://')) {
      return this.theme
    }

    return `https://unpkg.com/awsm.css/dist/awsm${
      this.theme ? `_theme_${this.theme}` : ''
    }.min.css`
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
      this.api = this.api || {
        get: async () => ({
          result: [],
          hasMore: false
        })
      };
      (async () => {
        window.faker = window.faker || (await import('faker'))
        const api = new FakeAPI(['/', '#/spa1', '#/spa2'])
        this.api = api
        this.user = api.user
      })()
    } else {
      this.firebase = this.firebase || JSON.parse(this._firebase)
    }

    this.parser = this.parser || new ShowdownParser()

    this.doLoad(true)
  }

  @Watch('api')
  @Watch('url')
  onPropStateChanged (): void {
    this.children = []
    this.doLoad(true)
  }

  render (): HTMLStencilElement {
    return (
      <Host>
        <base href="/" />
        <link rel="stylesheet" href={this.themeUrl} />

        <html class="hide-scrollbar">
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
                      onClick={() => {
                        this.mainEditor
                          .getValue()
                          .then(async v => {
                            if (!this.user) {
                              return
                            }

                            if (this.api.post) {
                              return this.api
                                .post({
                                  url: this.url,
                                  authorId: this.user.id,
                                  markdown: v
                                })
                                .then(({ entryId }) => {
                                  this.children = [
                                    {
                                      url: this.url,
                                      parentId: null,
                                      id: entryId,
                                      author: this.user,
                                      markdown: v,
                                      isDeleted: false,
                                      createdAt: new Date()
                                    },
                                    ...this.children
                                  ]
                                })
                            }

                            this.children = [
                              {
                                url: this.url,
                                parentId: null,
                                id: Math.random().toString(36).substr(2),
                                author: this.user,
                                markdown: v,
                                isDeleted: false,
                                createdAt: new Date()
                              },
                              ...this.children
                            ]
                          })
                          .finally(() => {
                            this.mainEditor.value = ''
                          })
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
            <button
              class="more"
              type="button"
              onClick={() => this.doLoad(true)}
            >
              Click for more
            </button>
          ) : null}
        </html>
      </Host>
    )
  }
}
