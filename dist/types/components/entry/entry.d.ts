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
  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;
  constructor();
  render(): HTMLStencilElement;
}
