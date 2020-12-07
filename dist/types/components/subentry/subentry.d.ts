import { HTMLStencilElement } from '../../stencil-public-runtime';
import { IAuthor, IPost } from '../../utils/faker';
import { IApi, IFirebaseConfig } from '../aloud-comments/aloud-comments';
/**
 * @internal
 */
export declare class AloudEntry {
  user?: IAuthor;
  parent: IAuthor;
  entry: IPost;
  api: IApi;
  firebase: IFirebaseConfig;
  parser: {
    parse: (md: string) => string;
  };
  isEdit: boolean;
  isReply: boolean;
  children: IPost[];
  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;
  constructor();
  render(): HTMLStencilElement;
}
