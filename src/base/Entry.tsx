import { EventEmitter, getAssetPath, h } from '@stencil/core'

import { IApi, IAuthor, IPost, IReactionType } from '../types'
import { humanizeDurationToNow } from '../utils/humanize'

export interface Entry {
  url: string;

  user?: IAuthor;
  api: IApi;
  entry: IPost;
  children: IPost[];

  isEdit: boolean;
  isReply: boolean;

  editorValue: string;
  replierValue: string;

  delete: EventEmitter<{
    entryId: string;
    hasChildren: boolean;
  }>;

  getReaction: (r: IReactionType) => string[];
  setReaction: (r: IReactionType) => Promise<void>;
  getSmallNav: (showAuthor: boolean) => HTMLElement;
}

export function initEntry<T extends Entry> (cls: T): void {
  cls.getReaction = (r: IReactionType): string[] => cls.entry[r]
  cls.setReaction = async (r: IReactionType) => {
    if (cls.api) {
      await cls.api
        .reaction({
          entryId: cls.entry.id,
          userId: cls.user.id,
          reaction: r
        })
        .then(({ like, dislike, bookmark }) => {
          cls.entry = {
            ...cls.entry,
            like,
            dislike,
            bookmark
          }
        })
    }
  }

  // eslint-disable-next-line react/display-name
  cls.getSmallNav = (showAuthor: boolean) => {
    const out: HTMLSpanElement[] = []
    const isSameAsCurrentUser = cls.entry.author.id === cls.user?.id

    if (cls.user) {
      out.push(
        <span class="reaction">
          <a
            role="button"
            title="Like"
            class={cls.getReaction('like').includes(cls.user.id) ? 'active' : ''}
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
            {cls.getReaction('like').length ? (
              <span>{cls.getReaction('like').length}</span>
            ) : null}
          </a>
        </span>,
        <span class="reaction">
          <a
            role="button"
            title="Dislike"
            class={cls.getReaction('dislike').includes(cls.user.id) ? 'active' : ''}
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
            {cls.getReaction('dislike').length ? (
              <span>{cls.getReaction('dislike').length}</span>
            ) : null}
          </a>
        </span>,
        <span class="reaction">
          <a
            role="button"
            title="Bookmark"
            class={cls.getReaction('bookmark').includes(cls.user.id) ? 'active' : ''}
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
            {cls.getReaction('bookmark').length ? (
              <span>{cls.getReaction('bookmark').length}</span>
            ) : null}
          </a>
        </span>,
        <span>
          <a
            role="button"
            onClick={async () => {
              if (cls.isReply && cls.replierValue.trim()) {
                await cls.api
                  .post({
                    url: cls.url,
                    authorId: cls.user.id,
                    parentId: cls.entry.id,
                    markdown: cls.replierValue
                  })
                  .then(({ entryId }) => {
                    cls.children = [
                      {
                        url: cls.url,
                        id: entryId,
                        author: cls.user,
                        parentId: cls.entry.id,
                        markdown: cls.replierValue,
                        createdAt: new Date(),
                        like: [],
                        dislike: [],
                        bookmark: []
                      },
                      ...cls.children
                    ]
                  })
              }

              cls.replierValue = ''
              cls.isReply = !cls.isReply
            }}
          >
            {cls.isReply ? cls.replierValue.trim() ? 'Post reply' : 'Undo reply' : 'Reply'}
          </a>
        </span>
      )
    }

    if (isSameAsCurrentUser) {
      out.push(
        <span>
          <a
            role="button"
            onClick={async () => {
              if (cls.isEdit && cls.editorValue.trim()) {
                await cls.api
                  .update({
                    entryId: cls.entry.id,
                    markdown: cls.editorValue
                  })
                  .then(({ isUpdated }) => {
                    if (isUpdated) {
                      cls.entry = {
                        ...cls.entry,
                        markdown: cls.editorValue,
                        updatedAt: new Date()
                      }
                    }
                  })
              }

              cls.isEdit = !cls.isEdit
            }}
          >
            {cls.isEdit ? cls.editorValue.trim() ? 'Save' : 'Undo edit' : 'Edit'}
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

    const smallItalic: string[] = []
    if (showAuthor) {
      smallItalic.push(
        `by ${cls.entry.author.name}`
      )

      if (cls.entry.author.id === cls.user?.id) {
        smallItalic.push('(me)')
      }
    }
    if (cls.entry.updatedAt) {
      smallItalic.push('(edited)')
    }

    out.push(
      <span>
        <span>{humanizeDurationToNow(cls.entry.createdAt)}</span>
      </span>,
      smallItalic.length ? (
        <span class="small-author">{smallItalic.join(' ')}</span>
      ) : null
    )

    return <small class="dot-separated">{out}</small>
  }
}
