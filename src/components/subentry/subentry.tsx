import {
  Component,
  Event,
  EventEmitter,
  Host,
  Method,
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
  tag: 'aloud-subentry',
  styleUrl: 'subentry.scss',
  scoped: true
})
export class AloudSubEntry {
  @Prop() user?: IAuthor;
  @Prop() parent!: IAuthor;
  @Prop({
    mutable: true
  })
  entry!: IPost;

  @Prop() api!: IApi;
  @Prop() firebase!: IFirebaseConfig;
  @Prop() parser!: {
    parse: (md: string) => string;
  };

  @Prop() countChangedListener!: (change: {
    entryId: string;
    count: number;
  }) => void;

  @Prop() limit!: number;
  @Prop() totalSubEntriesLength!: number;
  @Prop() isSmallScreen!: boolean;

  @Event() childrenCountChanged!: EventEmitter<{
    entryId: string;
    count: number;
  }>;

  @State() isEdit = false;
  @State() isReply = false;
  @State() isExpanded = false;
  @State() children: IPost[] = [];
  @State() hasMore = true;

  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;

  constructor () {
    this.doLoad(false)
  }

  @Method()
  async getChildren (): Promise<IPost[]> {
    return this.children
  }

  doLoad (forced: boolean): void {
    if (!forced && !this.limit) {
      return
    }

    this.api
      .get({
        parentId: this.entry.id,
        after: this.children[this.children.length - 1]?.id,
        limit: this.limit
      })
      .then(({ result, hasMore }) => {
        this.children = [...this.children, ...result]
        this.hasMore = hasMore

        this.childrenCountChanged.emit({
          entryId: this.entry.id,
          count: this.children.length
        })
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
      <Host>
        {this.isEdit ? (
          <aloud-editor
            parser={this.parser}
            firebase={this.firebase}
            ref={el => {
              this.editor = el
            }}
            value={this.entry.markdown}
          />
        ) : (
          <small
            role="button"
            onClick={() => {
              this.isExpanded = true
            }}
            innerHTML={(() => {
              const markdown
                = `[**@${this.parent.name}**](#) ` + this.entry.markdown

              if (this.isExpanded || !this.isSmallScreen) {
                return this.parser.parse(markdown)
              }

              const body = document.createElement('body')
              body.innerHTML = this.parser.parse(
                this.entry.markdown.slice(0, 80)
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
          ) : this.user ? (
            [
              // eslint-disable-next-line react/jsx-key
              <span>
                <a
                  role="button"
                  title="Like"
                  class={
                    this.getReaction('like').has(this.user.id) ? 'active' : ''
                  }
                  onClick={() => this.setReaction('like')}
                >
                  ❤️ {this.getReaction('like').size || ''}
                </a>
              </span>,
              // eslint-disable-next-line react/jsx-key
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
              // eslint-disable-next-line react/jsx-key
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
              </span>
            ]
          ) : null}

          <span>
            <a
              role="button"
              onClick={() => {
                if (this.replier) {
                  this.replier
                    .getValue()
                    .then(async v => {
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
                          createdAt: new Date()
                        },
                        ...this.children
                      ]
                    })
                    .finally(() => {
                      this.replier.value = ''
                    })
                }

                this.isReply = !this.isReply
              }}
            >
              {this.isReply ? 'Post reply' : 'Reply'}
            </a>
          </span>

          <span>{humanizeDurationToNow(this.entry.createdAt)}</span>
          <span class="small-author">
            by{' '}
            {this.entry.author.name
              + (this.entry.author.id === this.user?.id ? ' (me)' : '')}
          </span>
        </small>

        {this.isReply ? (
          <aloud-editor
            ref={el => {
              this.replier = el
            }}
            parser={this.parser}
            firebase={this.firebase}
          ></aloud-editor>
        ) : null}

        {this.children.map(it => (
          <aloud-subentry
            key={it.id}
            parser={this.parser}
            user={this.user}
            parent={this.entry.author}
            entry={it}
            api={this.api}
            firebase={this.firebase}
            limit={this.totalSubEntriesLength > 5 ? 0 : this.limit}
            isSmallScreen={this.isSmallScreen}
            totalSubEntriesLength={this.totalSubEntriesLength}
            countChangedListener={this.countChangedListener}
            onChildrenCountChanged={evt =>
              this.countChangedListener(evt.detail)
            }
          ></aloud-subentry>
        ))}

        {this.hasMore ? (
          <button class="more" type="button" onClick={() => this.doLoad(true)}>
            Click for more (to @{this.parent.name})
          </button>
        ) : null}
      </Host>
    )
  }
}
