import { EventEmitter } from '@stencil/core'

import { IApi, IPost } from '../types'

export interface EntryViewer {
  url: string;
  api: IApi;
  entry?: IPost;
  children: IPost[];
  hasMore: boolean;
  limit: number;

  childrenCountChanged?: EventEmitter<{
    entryId: string;
    count: number;
  }>;

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;
}

export function initEntryViewer<T extends EntryViewer> (cls: T): void {
  cls.doLoad = (forced: boolean) => {
    if (!forced && !cls.limit) {
      return
    }

    cls.api
      .get({
        url: cls.url,
        parentId: cls.entry ? cls.entry.id : null,
        after: cls.children[cls.children.length - 1]?.id,
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
      if (cls.api.delete) {
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
}
