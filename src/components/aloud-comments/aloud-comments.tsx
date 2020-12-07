import { Component, Prop, State, h } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import firebaseui from 'firebaseui'
import S from 'jsonschema-definer'

import { IAuthor, IPost, randomAuthor, randomPost } from '../../utils/faker'
import { ShowdownParser } from '../../utils/parser'

export interface IApi {
  get: (p: {
    parentId: string | null;
    after?: string;
    limit?: number;
  }) => Promise<{
    result: IPost[];
    hasMore: boolean;
  }>;
  post?: (p: {
    authorId: string;
    parentId?: string;
    markdown: string;
  }) => Promise<{
    entryId: string;
  }>;
  update?: (p: { entryId: string; markdown: string }) => Promise<void>;
  delete?: (p?: unknown) => Promise<unknown>;
}

export type IFirebaseConfig = {
  [k: string]: unknown;
};

@Component({
  tag: 'aloud-comments',
  styleUrl: 'aloud-comments.scss',
  shadow: true
})
export class AloudComments {
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
  api: IApi = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: null as any
  };

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
  @State() entries: IPost[] = [];
  @State() hasMore = true;

  mainEditor: HTMLAloudEditorElement;

  componentWillLoad (): void {
    if (!this.debug) {
      this.firebase
        = this.firebase || S.object().ensure(JSON.parse(this._firebase))
    }

    this.parser = this.parser || new ShowdownParser()

    this.api.get
      = this.api.get
      || ((): IApi['get'] => {
        const authors = {
          collection: [] as IAuthor[],
          new () {
            const a = randomAuthor()
            this.collection.push(a)
            return a
          },
          random () {
            return this.collection[
              Math.floor(Math.random() * this.collection.length)
            ]
          }
        }

        this.user = authors.new()

        Array(4)
          .fill(null)
          .map(() => authors.new())

        const posts = {
          collection: new Map<string, IPost>(),
          children: new Map<string | null, IPost[]>(),
          new (author: IAuthor, id: string, parent?: string) {
            parent = parent || null

            const a: IPost = {
              ...randomPost(
                parent
                  ? new Date(this.collection.get(parent).createdAt)
                  : undefined
              ),
              id,
              author
            }

            this.collection.set(a.id, a)

            const children = this.children.get(parent) || []
            children.push(a)
            this.children.set(parent, children)

            return a
          }
        }

        const genPost = (
          parents: number[] = [],
          minItems = 0,
          alwaysChild = 0
        ) => {
          if (parents.length > 5) {
            return
          }

          Array(Math.floor(Math.random() ** 2 * 10) + minItems)
            .fill(null)
            .map((_, i) => {
              posts.new(
                authors.random(),
                parents.map(j => j.toString()).join('') + i.toString(),
                parents.map(j => j.toString()).join('')
              )

              Array(alwaysChild)
                .fill(null)
                .map(() => {
                  genPost([...parents, i])
                })

              if (Math.random() ** 2 > 0.5) {
                genPost([...parents, i])
              }
            })
        }

        genPost([], 3, 1)

        return async ({ parentId, after, limit = this.maxChildrenAllowed }) => {
          let out = (posts.children.get(parentId || null) || []).sort(
            (i1, i2) => i2.createdAt - i1.createdAt
          )

          const i = after ? out.map(({ id }) => id).indexOf(after) : -1
          if (i !== -1) {
            out = out.slice(i + 1)
          }

          return {
            hasMore: out.length > limit,
            result: out.slice(0, limit)
          }
        }
      })()

    /**
     * `null` just stress that it is absolutely no parent, yet can still be switch case'd and comparable
     */
    this.api.get({ parentId: null }).then(({ result, hasMore }) => {
      this.entries = result
      this.hasMore = hasMore
    })
  }

  doLoad (): void {
    /**
     * `null` just stress that it is absolutely no parent, yet can still be switch case'd and comparable
     */
    this.api
      .get({ parentId: null, after: this.entries[this.entries.length - 1]?.id })
      .then(({ result, hasMore }) => {
        this.entries = [...this.entries, ...result]
        this.hasMore = hasMore
      })
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
                <div class="textarea">
                  <aloud-editor
                    parser={this.parser}
                    firebase={this.firebase}
                    ref={el => {
                      this.mainEditor = el
                    }}
                  />
                </div>
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
                                authorId: this.user.id,
                                markdown: v
                              })
                              .then(({ entryId }) => {
                                this.entries = [
                                  {
                                    id: entryId,
                                    author: this.user,
                                    markdown: v,
                                    createdAt: +new Date(),
                                    updatedAt: undefined
                                  },
                                  ...this.entries
                                ]
                              })
                          }

                          this.entries = [
                            {
                              id: Math.random().toString(36).substr(2),
                              author: this.user,
                              markdown: v,
                              createdAt: +new Date(),
                              updatedAt: undefined
                            },
                            ...this.entries
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

        {this.entries.map(it => (
          <aloud-entry
            key={it.id}
            parser={this.parser}
            user={this.user}
            entry={it}
            api={this.api}
            firebase={this.firebase}
            depth={1}
          ></aloud-entry>
        ))}

        {this.hasMore ? (
          <button class="more" type="button" onClick={() => this.doLoad()}>
            Click for more
          </button>
        ) : null}
      </main>
    )
  }
}
