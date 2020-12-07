import { HTMLStencilElement } from '../../stencil-public-runtime';
import firebaseui from 'firebaseui';
import { IAuthor, IPost } from '../../utils/faker';
export interface IApi {
  get: (p: {
    parentId: string | null;
    after?: string;
    limit?: number;
  }) => Promise<{
    result: IPost[];
    hasMore: boolean;
  }>;
  post?: (p: {
    authorId: string;
    parentId?: string;
    markdown: string;
  }) => Promise<{
    entryId: string;
  }>;
  update?: (p: {
    entryId: string;
    markdown: string;
  }) => Promise<void>;
  delete?: (p?: unknown) => Promise<unknown>;
}
export declare type IFirebaseConfig = {
  [k: string]: unknown;
};
export declare class AloudComments {
  /**
   * Firebase configuration. Will be `JSON.parse()`
   *
   * Requires either string version in HTML or Object version in JSX
   */
  _firebase: string;
  /**
   * Firebase configuration
   *
   * Actually is nullable in Debug mode.
   */
  firebase: IFirebaseConfig;
  /**
   * Custom `firebaseui.auth.AuthUI` object
   */
  firebaseui?: firebaseui.auth.AuthUI;
  /**
   * API configuration
   */
  api: IApi;
  parser: {
    parse: (md: string) => string;
  };
  /**
   * Number of children to load by default
   */
  maxChildrenAllowed: number;
  /**
   * Whether to generate random entries
   *
   * Requires `faker` to be installed.
   */
  debug: boolean;
  user?: IAuthor;
  entries: IPost[];
  hasMore: boolean;
  mainEditor: HTMLAloudEditorElement;
  componentWillLoad(): void;
  doLoad(): void;
  render(): HTMLStencilElement;
}
