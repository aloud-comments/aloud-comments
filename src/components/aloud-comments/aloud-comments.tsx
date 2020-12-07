import { Component, Prop, State, h } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'
import firebaseui from 'firebaseui'
import S from 'jsonschema-definer'

import {
  IAuthor,
  IPost,
  randomAuthor,
  randomPost
} from '../../utils/faker'
import { ShowdownParser } from '../../utils/parser'

export interface IApi {
  get: (p: { parentId: string | null }) => Promise<IPost[]>;
  post?: (p: {
    authorId: string;
    parentId?: string;
    markdown: string;
  }) => Promise<{
    entryId: string;
  }>;
  update?: (p: {
    entryId: string;
    markdown: string;
  }) => Promise<void>;
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
   * Whether to generate random entries
   *
   * Requires `faker` to be installed.
   */
  @Prop() debug = false;

  @State() user?: IAuthor;
  @State() entries: IPost[] = [];

  mainEditor: HTMLAloudEditorElement;

  componentWillLoad (): void {
    if (!this.debug) {
      this.firebase
        = this.firebase
        || S.object().ensure(JSON.parse(this._firebase))
    }

    this.parser = this.parser || new ShowdownParser()

    this.api.get
      = this.api.get
      || (async ({ parentId }) => {
        const authors = {
          collection: [] as IAuthor[],
          new () {
            const a = randomAuthor()
            this.collection.push(a)
            return a
          }
        }

        let out: IPost[] = []

        const posts = {
          collection: new Map<string, IPost>(),
          new (id: string, parent?: string) {
            const a = randomPost(
              parent
                ? new Date(
                    this.collection.get(parent).createdAt
                  )
                : undefined
            )
            this.collection.set(id, {
              ...a,
              id
            })
            return a
          }
        }

        this.user = authors.new()

        switch (parentId) {
          case '111':
            out = [
              {
                ...posts.new('1111', '111'),
                author: this.user
              }
            ]
            break
          case '11':
            out = [
              {
                ...posts.new('111', '11'),
                author: authors.new()
              }
            ]
            break
          case '1':
            out = [
              {
                ...posts.new('11', '1'),
                author: authors.collection[0]
              },
              {
                ...posts.new('12', '1'),
                author: authors.new()
              }
            ]
            break
          case null:
            out = [
              {
                ...posts.new('0'),
                author: authors.new()
              },
              {
                ...posts.new('1'),
                author: authors.new()
              },
              {
                ...posts.new('2'),
                author: authors.collection[4]
              }
            ]
        }

        return out.sort(
          (i1, i2) => i2.createdAt - i1.createdAt
        )
      })

    /**
     * `null` just stress that it is absolutely no parent, yet can still be switch case'd and comparable
     */
    this.api.get({ parentId: null }).then(data => {
      this.entries = data
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
                              id: Math.random()
                                .toString(36)
                                .substr(2),
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
      </main>
    )
  }
}
