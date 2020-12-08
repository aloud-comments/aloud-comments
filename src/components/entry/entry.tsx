import {
  Component,
  Event,
  EventEmitter,
  Host,
  Prop,
  State,
  h
} from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'

import { IAuthor, IPost, IReactionType, ReactionTypes } from '../../types'
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
  @Prop({
    mutable: true
  })
  entry!: IPost;

  @Prop() api!: IApi;
  @Prop() firebase!: IFirebaseConfig;
  @Prop() depth!: number;
  @Prop() parser!: {
    parse: (md: string) => string;
  };

  @Prop() isSmallScreen!: boolean;

  @Event() delete!: EventEmitter<{
    entryId: string;
    hasChildren: boolean;
  }>;

  @State() isEdit = false;
  @State() isReply = false;
  @State() isExpanded = false;
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

  get maxDepth (): number {
    if (this.isSmallScreen) {
      return 1
    }

    return 2
  }

  componentWillLoad (): void {
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

  getReaction (r: IReactionType): Set<string> {
    return (this.entry.reaction || {})[r] || new Set()
  }

  async setReaction (r: IReactionType): Promise<void> {
    return (async () => {
      this.entry.reaction = this.entry.reaction || {
        like: new Set(),
        dislike: new Set(),
        bookmark: new Set()
      }

      if (this.api.reaction) {
        return this.api
          .reaction({
            entryId: this.entry.id,
            userId: this.user.id,
            reaction: r
          })
          .then(({ changes }) => {
            for (const k of ReactionTypes) {
              const c = changes[k] || 0
              if (c > 0) {
                this.entry.reaction.dislike.add(this.user.id)
              } else if (c < 0) {
                this.entry.reaction.dislike.delete(this.user.id)
              }
            }
          })
      }

      if (r === 'like') {
        this.entry.reaction.dislike.delete(this.user.id)
      } else if (r === 'dislike') {
        this.entry.reaction.like.delete(this.user.id)
      }

      if (this.entry.reaction[r].has(this.user.id)) {
        this.entry.reaction[r].delete(this.user.id)
      } else {
        this.entry.reaction[r].add(this.user.id)
      }
    })().finally(() => {
      this.entry = {
        ...this.entry,
        reaction: this.entry.reaction
      }
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
              <div
                role="button"
                onClick={() => {
                  this.isExpanded = true
                }}
                innerHTML={(() => {
                  if (this.isExpanded || !this.isSmallScreen) {
                    return this.parser.parse(this.entry.markdown)
                  }

                  const body = document.createElement('body')
                  body.innerHTML = this.parser.parse(
                    this.entry.markdown.slice(0, 140)
                  )

                  const { lastElementChild } = body.firstElementChild || {}
                  if (lastElementChild instanceof HTMLParagraphElement) {
                    lastElementChild.innerHTML += '...'
                  } else {
                    body.innerHTML += '...'
                  }

                  return body.innerHTML
                })()}
              />
            )}
            <small class="dot-separated">
              {(() => {
                const out: HTMLSpanElement[] = []
                const isSameAsCurrentUser
                  = this.entry.author.id === this.user?.id

                if (!this.entry.isDeleted && this.user) {
                  out.push(
                    <span>
                      <a
                        role="button"
                        title="Like"
                        class={
                          this.getReaction('like').has(this.user.id)
                            ? 'active'
                            : ''
                        }
                        onClick={() => this.setReaction('like')}
                      >
                        ❤️ {this.getReaction('like').size || ''}
                      </a>
                    </span>,
                    <span>
                      <a
                        role="button"
                        title="Dislike"
                        class={
                          this.getReaction('dislike').has(this.user.id)
                            ? 'active'
                            : ''
                        }
                        onClick={() => this.setReaction('dislike')}
                      >
                        👎 {this.getReaction('dislike').size || ''}
                      </a>
                    </span>,
                    <span>
                      <a
                        role="button"
                        title="Bookmark"
                        class={
                          this.getReaction('bookmark').has(this.user.id)
                            ? 'active'
                            : ''
                        }
                        onClick={() => this.setReaction('bookmark')}
                      >
                        🔖 {this.getReaction('bookmark').size || ''}
                      </a>
                    </span>,
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
                                  author: this.entry.author,
                                  markdown: v,
                                  isDeleted: false,
                                  createdAt: new Date()
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
                  )
                }

                if (!this.entry.isDeleted && isSameAsCurrentUser) {
                  out.push(
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
                    </span>,
                    <span>
                      <a
                        role="button"
                        onClick={() =>
                          this.delete.emit({
                            entryId: this.entry.id,
                            hasChildren: !!this.children.length
                          })
                        }
                      >
                        Delete
                      </a>
                    </span>
                  )
                }

                out.push(
                  <span>{humanizeDurationToNow(this.entry.createdAt)}</span>
                )

                return out
              })()}
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
                isSmallScreen={this.isSmallScreen}
                totalSubEntriesLength={this.subEntriesLength}
                countChangedListener={this.subEntryCountListener}
                onDelete={evt => this.doDelete(evt.detail)}
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
                isSmallScreen={this.isSmallScreen}
                onDelete={evt => this.doDelete(evt.detail)}
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
