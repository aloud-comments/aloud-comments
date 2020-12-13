import { EventEmitter } from '@stencil/core'

import { IApi, IPost, IPostNormalized } from '../types/base'

export type IPostChange = {
  type: 'added' | 'modified' | 'removed';
  id: string;
  // Unfold data first
  data: unknown;
};

export interface EntryViewer {
  url: string;
  api: IApi;
  entry?: IPost;
  parentId?: string;
  children: IPost[];
  hasMore: boolean;
  limit: number;
  realtimeUpdates: IPostChange[];

  isVisible: boolean;
  visibleObserver: IntersectionObserver;

  childrenCountChanged?: EventEmitter<{
    entryId: string;
    count: number;
  }>;

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;

  doOnRealtimeChange: () => Promise<void>;
}

export function initEntryViewer<T extends EntryViewer> (
  cls: T,
  $el: HTMLElement
): void {
  cls.visibleObserver = new IntersectionObserver(
    cs =>
      cs.map(c => {
        cls.isVisible = c.isIntersecting
      }),
    {
      threshold: 0.1
    }
  )
  cls.visibleObserver.observe($el)

  cls.doLoad = (forced: boolean) => {
    if (!forced) {
      if (!cls.limit || !cls.isVisible) {
        return
      }
    }

    if (!cls.api) {
      return
    }

    cls.api
      .get({
        url: cls.url,
        parentId: cls.entry ? cls.entry.id : null,
        after: cls.children[cls.children.length - 1]?.createdAt,
        limit: cls.limit
      })
      .then(({ result, hasMore }) => {
        cls.children = [...cls.children, ...result]
        cls.hasMore = hasMore

        if (cls.childrenCountChanged) {
          cls.childrenCountChanged.emit({
            entryId: cls.entry.id,
            count: cls.children.length
          })
        }
      })
  }
  cls.doDelete = async ({
    entryId,
    hasChildren
  }: {
    entryId: string;
    hasChildren: boolean;
  }) => {
    return (async () => {
      if (cls.api) {
        return cls.api.delete({ entryId })
      }

      return {
        status: hasChildren ? 'suppressed' : 'deleted'
      }
    })().then(({ status }) => {
      if (status === 'deleted') {
        cls.children = cls.children.filter(it => it.id !== entryId)
      } else {
        const i = cls.children.map(it => it.id).indexOf(entryId)
        if (cls.children[i]) {
          cls.children = [
            ...cls.children.slice(0, i),
            {
              ...cls.children[i],
              markdown: '*Deleted*',
              isDeleted: true
            },
            ...cls.children.slice(i + 1)
          ]
        }
      }
    })
  }

  cls.doOnRealtimeChange = async (): Promise<void> => {
    const cs: IPost[] = []

    cls.children.map(c => {
      const it = cls.realtimeUpdates.find(r => r.id === c.id)
      if (it) {
        if (it.type === 'modified') {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { authorId: _, ...a } = it.data as Omit<IPostNormalized, 'id'>
          cs.push({ ...c, ...a })
        }
        // else 'removed'
      } else {
        cs.push(c)
      }
    })

    const prevIds = new Set(cs.map(c => c.id))

    await Promise.all(
      cls.realtimeUpdates
        .filter(r => r.type === 'added')
        .map(async it => {
          if (prevIds.has(it.id)) {
            prevIds.add(it.id)

            const { authorId, ...a } = it.data as Omit<IPostNormalized, 'id'>
            cs.push({
              ...a,
              id: it.id,
              author: await cls.api.getAuthor(authorId)
            })
          }
        })
    )

    cls.children = cs.sort((i1, i2) => i2.createdAt - i1.createdAt)
  }
}
