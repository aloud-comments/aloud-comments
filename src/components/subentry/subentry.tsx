import { Component, Host, Prop, State, h } from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'

import { IAuthor, IPost } from '../../utils/faker'
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
export class AloudEntry {
  @Prop() user?: IAuthor;
  @Prop() parent!: IAuthor;
  @Prop() entry!: IPost;
  @Prop() api!: IApi;
  @Prop() firebase!: IFirebaseConfig;
  @Prop() parser!: {
    parse: (md: string) => string;
  };

  @State() isEdit = false;
  @State() isReply = false;
  @State() children: IPost[] = [];

  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;

  constructor () {
    this.api.get({ parentId: this.parent.id }).then(data => {
      this.children = data
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
            ref={() => {
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
            }}
            innerHTML={this.parser.parse(
              `[**@${this.parent.name}**](#) ` + this.entry.markdown
            )}
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
            {this.entry.author.id === this.user?.id
              ? 'me'
              : this.entry.author.name}
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
          ></aloud-subentry>
        ))}
      </Host>
    )
  }
}
