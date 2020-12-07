import { HTMLStencilElement } from '../../stencil-public-runtime';
import firebaseui from 'firebaseui';
import { IAuthor, IPost } from '../../utils/faker';
export interface IApi {
  get: (p: {
    parentId: string | null;
  }) => Promise<IPost[]>;
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
   * Whether to generate random entries
   *
   * Requires `faker` to be installed.
   */
  debug: boolean;
  user?: IAuthor;
  entries: IPost[];
  mainEditor: HTMLAloudEditorElement;
  componentWillLoad(): void;
  render(): HTMLStencilElement;
}
