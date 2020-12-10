import { EventEmitter, getAssetPath, h } from '@stencil/core'

import { IApi, IAuthor, IPost, IReactionType, ReactionTypes } from '../types'
import { humanizeDurationToNow } from '../utils/humanize'

export interface Entry {
  url: string;

  user?: IAuthor;
  api: IApi;
  entry: IPost;
  children: IPost[];

  isEdit: boolean;
  isReply: boolean;

  delete: EventEmitter<{
    entryId: string;
    hasChildren: boolean;
  }>;

  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;

  getReaction: (r: IReactionType) => Set<string>;
  setReaction: (r: IReactionType) => Promise<void>;
  getSmallNav: (showAuthor: boolean) => HTMLElement;
}

export function initEntry<T extends Entry> (cls: T): void {
  cls.getReaction = (r: IReactionType) =>
    (cls.entry.reaction || {})[r] || new Set()
  cls.setReaction = async (r: IReactionType) => {
    return (async () => {
      cls.entry.reaction = cls.entry.reaction || {
        like: new Set(),
        dislike: new Set(),
        bookmark: new Set()
      }

      if (cls.api.reaction) {
        return cls.api
          .reaction({
            entryId: cls.entry.id,
            userId: cls.user.id,
            reaction: r
          })
          .then(({ changes }) => {
            for (const k of ReactionTypes) {
              const c = changes[k] || 0
              if (c > 0) {
                cls.entry.reaction.dislike.add(cls.user.id)
              } else if (c < 0) {
                cls.entry.reaction.dislike.delete(cls.user.id)
              }
            }
          })
      }

      if (r === 'like') {
        cls.entry.reaction.dislike.delete(cls.user.id)
      } else if (r === 'dislike') {
        cls.entry.reaction.like.delete(cls.user.id)
      }

      if (cls.entry.reaction[r].has(cls.user.id)) {
        cls.entry.reaction[r].delete(cls.user.id)
      } else {
        cls.entry.reaction[r].add(cls.user.id)
      }
    })().then(() => {
      cls.entry = {
        ...cls.entry,
        reaction: cls.entry.reaction
      }
    })
  }

  // eslint-disable-next-line react/display-name
  cls.getSmallNav = (showAuthor: boolean) => {
    const out: HTMLSpanElement[] = []
    const isSameAsCurrentUser = cls.entry.author.id === cls.user?.id

    if (!cls.entry.isDeleted && cls.user) {
      out.push(
        <span class="reaction">
          <a
            role="button"
            title="Like"
            class={cls.getReaction('like').has(cls.user.id) ? 'active' : ''}
            onClick={() => cls.setReaction('like')}
          >
            <img
              class="icon"
              src={getAssetPath('../assets/heart.svg')}
              onError={ev => {
                (ev.target as HTMLImageElement).src = getAssetPath(
                  '../collection/assets/heart.svg'
                )
              }}
            />
            {cls.getReaction('like').size ? (
              <span>{cls.getReaction('like').size}</span>
            ) : null}
          </a>
        </span>,
        <span class="reaction">
          <a
            role="button"
            title="Dislike"
            class={cls.getReaction('dislike').has(cls.user.id) ? 'active' : ''}
            onClick={() => cls.setReaction('dislike')}
          >
            <img
              class="icon"
              src={getAssetPath('../assets/dislike.svg')}
              onError={ev => {
                (ev.target as HTMLImageElement).src = getAssetPath(
                  '../collection/assets/dislike.svg'
                )
              }}
            />
            {cls.getReaction('dislike').size ? (
              <span>{cls.getReaction('dislike').size}</span>
            ) : null}
          </a>
        </span>,
        <span class="reaction">
          <a
            role="button"
            title="Bookmark"
            class={cls.getReaction('bookmark').has(cls.user.id) ? 'active' : ''}
            onClick={() => cls.setReaction('bookmark')}
          >
            <img
              class="icon"
              src={getAssetPath('../assets/bookmark.svg')}
              onError={ev => {
                (ev.target as HTMLImageElement).src = getAssetPath(
                  '../collection/assets/bookmark.svg'
                )
              }}
            />
            {cls.getReaction('bookmark').size ? (
              <span>{cls.getReaction('bookmark').size}</span>
            ) : null}
          </a>
        </span>,
        <span>
          <a
            role="button"
            onClick={() => {
              if (cls.replier) {
                cls.replier
                  .getValue()
                  .then(async v => {
                    if (!v.trim()) {
                      return
                    }

                    if (cls.api.post) {
                      return cls.api
                        .post({
                          url: this.url,
                          authorId: cls.entry.author.id,
                          parentId: cls.entry.id,
                          markdown: v
                        })
                        .then(({ entryId }) => {
                          cls.children = [
                            {
                              url: this.url,
                              id: entryId,
                              author: cls.entry.author,
                              parentId: cls.entry.id,
                              markdown: v,
                              createdAt: new Date()
                            },
                            ...cls.children
                          ]
                        })
                    }

                    cls.children = [
                      {
                        url: this.url,
                        id: Math.random().toString(36).substr(2),
                        author: cls.entry.author,
                        parentId: cls.entry.id,
                        markdown: v,
                        createdAt: new Date()
                      },
                      ...cls.children
                    ]
                  })
                  .finally(() => {
                    cls.replier.value = ''
                  })
              }

              cls.isReply = !cls.isReply
            }}
          >
            {cls.isReply ? 'Post reply' : 'Reply'}
          </a>
        </span>
      )
    }

    if (!cls.entry.isDeleted && isSameAsCurrentUser) {
      out.push(
        <span>
          <a
            role="button"
            onClick={() => {
              if (cls.editor) {
                cls.editor.getValue().then(async v => {
                  if (cls.api.update) {
                    return cls.api
                      .update({
                        entryId: cls.entry.id,
                        markdown: v
                      })
                      .then(() => {
                        cls.entry = {
                          ...cls.entry,
                          markdown: v
                        }
                      })
                  }

                  cls.entry = {
                    ...cls.entry,
                    markdown: v
                  }
                })
              }

              cls.isEdit = !cls.isEdit
            }}
          >
            {cls.isEdit ? 'Save' : 'Edit'}
          </a>
        </span>,
        <span>
          <a
            role="button"
            onClick={() =>
              cls.delete.emit({
                entryId: cls.entry.id,
                hasChildren: !!cls.children.length
              })
            }
          >
            Delete
          </a>
        </span>
      )
    }

    out.push(<span>{humanizeDurationToNow(cls.entry.createdAt)}</span>)

    if (showAuthor) {
      out.push(
        <span class="small-author">
          by{' '}
          {cls.entry.author.name
            + (cls.entry.author.id === cls.user?.id ? ' (me)' : '')}
        </span>
      )
    }

    return <small class="dot-separated">{out}</small>
  }
}
