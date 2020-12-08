import { Component, Prop, State, h } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import firebaseui from 'firebaseui'

import { IAuthor, IPost, IReactionType } from '../../types'
import { randomAuthor, randomPost } from '../../utils/faker'
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
  reaction?: (p: {
    entryId: string;
    userId: string;
    reaction: IReactionType;
  }) => Promise<{
    changes: {
      [t in IReactionType]?: number;
    };
  }>;
  delete?: (p: {
    entryId: string;
  }) => Promise<{
    status: 'deleted' | 'suppressed';
  }>;
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
  @State() children: IPost[] = [];
  @State() hasMore = true;
  @State() isSmallScreen = false;

  mainEditor: HTMLAloudEditorElement;

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

    if (!this.debug) {
      this.firebase = this.firebase || JSON.parse(this._firebase)
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
          new (author: IAuthor, id: string, parent?: string): IPost {
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
          {
            minItems = 1
          }: {
            minItems?: number;
          } = {}
        ): IPost[] => {
          if (parents.length > 5) {
            return []
          }

          let hasChildren = false

          const out = Array(Math.floor(Math.random() ** 2 * 9) + minItems)
            .fill(null)
            .map((_, i) => {
              const ps = [
                posts.new(
                  authors.random(),
                  parents.map(j => j.toString()).join('') + i.toString(),
                  parents.map(j => j.toString()).join('')
                )
              ]

              if (Math.random() ** 2 > 0.5) {
                hasChildren = true
                return [...ps, ...genPost([...parents, i])]
              }

              return ps
            })
            .reduce((prev, c) => [...prev, ...c], [])

          if (parents.length < 5 && !hasChildren) {
            const i = 9
            return [
              ...out,
              posts.new(
                authors.random(),
                parents.map(j => j.toString()).join('') + i.toString(),
                parents.map(j => j.toString()).join('')
              ),
              ...genPost([...parents, i])
            ]
          }

          return out
        }

        genPost([], { minItems: 3 })

        return async ({ parentId, after, limit = this.maxChildrenAllowed }) => {
          let out = (
            posts.children.get(parentId || null) || []
          ).sort((i1, i2) => (i1.createdAt < i2.createdAt ? -1 : 1))

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
      this.children = result
      this.hasMore = hasMore
    })
  }

  doLoad (): void {
    /**
     * `null` just stress that it is absolutely no parent, yet can still be switch case'd and comparable
     */
    this.api
      .get({
        parentId: null,
        after: this.children[this.children.length - 1]?.id
      })
      .then(({ result, hasMore }) => {
        this.children = [...this.children, ...result]
        this.hasMore = hasMore
      })
  }

  async doDelete ({
    entryId,
    hasChildren
  }: {
    entryId: string;
    hasChildren: boolean;
  }): Promise<void> {
    return (async () => {
      if (this.api.delete) {
        return this.api.delete({ entryId })
      }

      return {
        status: hasChildren ? 'suppressed' : 'deleted'
      }
    })().then(({ status }) => {
      if (status === 'deleted') {
        this.children = this.children.filter(it => it.id !== entryId)
      } else {
        const i = this.children.map(it => it.id).indexOf(entryId)
        if (this.children[i]) {
          this.children = [
            ...this.children.slice(0, i),
            {
              ...this.children[i],
              markdown: '*Deleted*',
              isDeleted: true
            },
            ...this.children.slice(i + 1)
          ]
        }
      }
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
                                this.children = [
                                  {
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
            key={it.id}
            parser={this.parser}
            user={this.user}
            entry={it}
            api={this.api}
            firebase={this.firebase}
            isSmallScreen={this.isSmallScreen}
            depth={1}
            onDelete={evt => this.doDelete(evt.detail)}
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
