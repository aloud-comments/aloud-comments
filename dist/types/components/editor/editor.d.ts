import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/css/css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/mode/overlay';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/display/placeholder';
import { HTMLStencilElement } from '../../stencil-public-runtime';
import CodeMirror from 'codemirror';
import { IFirebaseConfig } from '../aloud-comments/aloud-comments';
/**
 * @internal
 */
export declare class Editor {
  /**
   * Markdown to be parsed in-and-out of the editor
   *
   * Use `.getValue()` to get and update the value
   */
  value: string;
  firebase: IFirebaseConfig;
  parser: {
    parse: (md: string) => string;
  };
  html: string;
  _isEdit: boolean;
  cm: CodeMirror.Editor;
  cmEl: HTMLTextAreaElement;
  setEdit(b: boolean): void;
  initCm(): Promise<void>;
  getValue(): Promise<string>;
  parse(): Promise<string>;
  render(): HTMLStencilElement;
}
