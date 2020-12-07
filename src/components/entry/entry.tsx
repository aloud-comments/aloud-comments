import { Component, Host, Prop, State, h } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'

import { IAuthor, IPost } from '../../utils/faker'
import { humanizeDurationToNow } from '../../utils/humanize'
import { IApi, IFirebaseConfig } from '../aloud-comments/aloud-comments'

/**
 * @internal
 */
@Component({
  tag: 'aloud-entry',
  styleUrl: 'entry.scss',
  scoped: true
})
export class AloudEntry {
  @Prop() user?: IAuthor;
  @Prop() entry!: IPost;
  @Prop() api!: IApi;
  @Prop() firebase!: IFirebaseConfig;
  @Prop() depth!: number;
  @Prop() parser!: {
    parse: (md: string) => string;
  };

  @State() isEdit = false;
  @State() isReply = false;
  @State() maxDepth = 2;
  @State() children: IPost[] = [];
  @State() hasMore = true;
  @State() subEntries = new Map<
    string,
    {
      count: number;
    }
  >();

  readonly newSubEntriesAllowed = 2;

  subEntryCountListener = (p: { entryId: string; count: number }): void => {
    this.subEntries.set(p.entryId, { count: p.count })
  };

  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;

  get subEntriesLength (): number {
    return Array.from(this.subEntries.values()).reduce(
      (prev, c) => prev + c.count,
      0
    )
  }

  constructor () {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const cls = this

    const mq = matchMedia('(max-width: 600px)')
    cls.maxDepth = mq.matches ? 1 : 2
    mq.onchange = evt => {
      cls.maxDepth = evt.matches ? 1 : 2
    }

    this.doLoad()
  }

  doLoad (): void {
    this.api
      .get({
        parentId: this.entry.id,
        after: this.children[this.children.length - 1]?.id
      })
      .then(({ result, hasMore }) => {
        this.children = [...this.children, ...result]
        this.hasMore = hasMore
      })
  }

  render (): HTMLStencilElement {
    return (
      <Host class="media">
        <figure class="media-left">
          <p class="image is-48x48">
            <img
              src={this.entry.author.image}
              alt={this.entry.author.name}
              title={this.entry.author.name}
            />
          </p>
        </figure>
        <div class="media-content">
          <div class="content">
            <h5>{this.entry.author.name}</h5>
            {this.isEdit ? (
              <aloud-editor
                class="textarea"
                parser={this.parser}
                firebase={this.firebase}
                ref={el => {
                  this.editor = el
                }}
                value={this.entry.markdown}
              />
            ) : (
              <div innerHTML={this.parser.parse(this.entry.markdown)} />
            )}
            <small class="dot-separated">
              {this.entry.author.id === this.user?.id ? (
                <span>
                  <a
                    role="button"
                    onClick={() => {
                      if (this.editor) {
                        this.editor.getValue().then(async v => {
                          if (this.api.update) {
                            return this.api
                              .update({
                                entryId: this.entry.id,
                                markdown: v
                              })
                              .then(() => {
                                this.entry = {
                                  ...this.entry,
                                  markdown: v
                                }
                              })
                          }

                          this.entry = {
                            ...this.entry,
                            markdown: v
                          }
                        })
                      }

                      this.isEdit = !this.isEdit
                    }}
                  >
                    {this.isEdit ? 'Save' : 'Edit'}
                  </a>
                </span>
              ) : (
                [
                  // eslint-disable-next-line react/jsx-key
                  <span>
                    <a role="button" title="Like">
                      ❤️
                    </a>
                  </span>,
                  // eslint-disable-next-line react/jsx-key
                  <span>
                    <a role="button" title="Dislike">
                      👎
                    </a>
                  </span>,
                  // eslint-disable-next-line react/jsx-key
                  <span>
                    <a role="button" title="Bookmark">
                      🔖
                    </a>
                  </span>
                ]
              )}

              <span>
                <a
                  role="button"
                  onClick={() => {
                    if (this.replier) {
                      this.replier.getValue().then(async v => {
                        if (!v.trim()) {
                          return
                        }

                        if (this.api.post) {
                          return this.api
                            .post({
                              authorId: this.entry.author.id,
                              parentId: this.entry.id,
                              markdown: v
                            })
                            .then(({ entryId }) => {
                              this.children = [
                                {
                                  id: entryId,
                                  author: this.entry.author,
                                  markdown: v,
                                  createdAt: +new Date(),
                                  updatedAt: undefined
                                },
                                ...this.children
                              ]
                            })
                        }

                        this.children = [
                          {
                            id: Math.random().toString(36).substr(2),
                            author: this.entry.author,
                            markdown: v,
                            createdAt: +new Date(),
                            updatedAt: undefined
                          },
                          ...this.children
                        ]
                      })
                    }

                    this.isReply = !this.isReply
                  }}
                >
                  {this.isReply ? 'Post reply' : 'Reply'}
                </a>
              </span>

              <span>{humanizeDurationToNow(this.entry.createdAt)}</span>
            </small>
          </div>

          {this.isReply ? (
            <aloud-editor
              class="textarea"
              parser={this.parser}
              ref={el => {
                this.replier = el
              }}
              firebase={this.firebase}
            ></aloud-editor>
          ) : null}

          {this.children.map(it =>
            this.depth > this.maxDepth ? (
              <aloud-subentry
                parser={this.parser}
                user={this.user}
                parent={this.entry.author}
                entry={it}
                api={this.api}
                firebase={this.firebase}
                limit={this.newSubEntriesAllowed}
                totalSubEntriesLength={this.subEntriesLength}
                countChangedListener={this.subEntryCountListener}
                onChildrenCountChanged={evt =>
                  this.subEntryCountListener(evt.detail)
                }
              ></aloud-subentry>
            ) : (
              <aloud-entry
                parser={this.parser}
                user={this.user}
                entry={it}
                api={this.api}
                firebase={this.firebase}
                depth={this.depth + 1}
              ></aloud-entry>
            )
          )}

          {this.hasMore ? (
            <button class="more" type="button" onClick={() => this.doLoad()}>
              Click for more
            </button>
          ) : null}
        </div>
      </Host>
    )
  }
}
