import { EventEmitter } from '../../stencil-public-runtime';
import { HTMLStencilElement } from '../../stencil-public-runtime';
import { IAuthor, IPost } from '../../utils/faker';
import { IApi, IFirebaseConfig } from '../aloud-comments/aloud-comments';
/**
 * @internal
 */
export declare class AloudSubEntry {
  user?: IAuthor;
  parent: IAuthor;
  entry: IPost;
  api: IApi;
  firebase: IFirebaseConfig;
  parser: {
    parse: (md: string) => string;
  };
  countChangedListener: (change: {
    entryId: string;
    count: number;
  }) => void;
  limit: number;
  totalSubEntriesLength: number;
  childrenCountChanged: EventEmitter<{
    entryId: string;
    count: number;
  }>;
  isEdit: boolean;
  isReply: boolean;
  children: IPost[];
  hasMore: boolean;
  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;
  constructor();
  getChildren(): Promise<IPost[]>;
  doLoad(forced: boolean): void;
  render(): HTMLStencilElement;
}
