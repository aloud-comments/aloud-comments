import { HTMLStencilElement } from '../../stencil-public-runtime';
import { IAuthor, IPost } from '../../utils/faker';
import { IApi, IFirebaseConfig } from '../aloud-comments/aloud-comments';
/**
 * @internal
 */
export declare class AloudEntry {
  user?: IAuthor;
  entry: IPost;
  api: IApi;
  firebase: IFirebaseConfig;
  depth: number;
  parser: {
    parse: (md: string) => string;
  };
  isEdit: boolean;
  isReply: boolean;
  maxDepth: number;
  children: IPost[];
  hasMore: boolean;
  subEntries: Map<string, {
    count: number;
  }>;
  readonly newSubEntriesAllowed = 2;
  subEntryCountListener: (p: {
    entryId: string;
    count: number;
  }) => void;
  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;
  get subEntriesLength(): number;
  constructor();
  doLoad(): void;
  render(): HTMLStencilElement;
}
