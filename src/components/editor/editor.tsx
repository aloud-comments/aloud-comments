import 'codemirror/mode/markdown/markdown'
import 'codemirror/mode/css/css'
import 'codemirror/mode/xml/xml'
import 'codemirror/mode/htmlmixed/htmlmixed'
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/mode/overlay'
import 'codemirror/addon/comment/comment'
import 'codemirror/addon/display/placeholder'

import {
  Component,
  Event,
  EventEmitter,
  Host,
  Prop,
  State,
  h
} from '@stencil/core'

import CodeMirror from 'codemirror'
import { HTMLStencilElement } from '@stencil/core/internal'

/**
 * @internal
 */
@Component({
  tag: 'aloud-editor',
  styleUrl: 'editor.scss',
  shadow: true
})
export class Editor {
  /**
   * Markdown to be parsed in-and-out of the editor
   *
   * Use `.getValue()` to get and update the value
   */
  @Prop({ mutable: true, reflect: true }) value = '';
  @Prop() parser!: {
    parse: (md: string) => string;
  };

  @Prop() theme!: string;

  @State() html = '';
  @State() _isEdit = true;

  @Event() cmChange: EventEmitter<{
    value: string;
  }>;

  cm!: CodeMirror.Editor;
  cmEl!: HTMLTextAreaElement;

  setEdit (b: boolean): void {
    this._isEdit = b

    if (!b) {
      this.parse()
    } else if (this.cm) {
      this.cm.setValue(this.value)
    }
  }

  async initCm (): Promise<void> {
    if (this.cm) {
      return
    }

    await new Promise(resolve => setTimeout(resolve, 10))

    const shiftTabs = (d: number) => {
      const spaces = Array(this.cm.getOption('indentUnit') + d).join(' ')
      const doc = this.cm.getDoc()
      const { line: startLine } = this.cm.getCursor()
      const endPoint = this.cm.getCursor('to')

      const lines = doc
        .getRange({ ch: 0, line: startLine }, endPoint)
        .split(/\n/g)
        .map(r => spaces + r)
      doc.replaceRange(lines.join('\n'), { ch: 0, line: startLine }, endPoint)
    }

    this.cm = CodeMirror.fromTextArea(this.cmEl, {
      mode: 'markdown',
      autoCloseBrackets: true,
      lineWrapping: true,
      tabSize: 4,
      extraKeys: {
        Tab: () => shiftTabs(1),
        'Shift-Tab': () => shiftTabs(-1)
      },
      theme: this.theme
    })

    this.cm.setValue(this.value)

    this.cm.on('change', cm => {
      this.cmChange.emit({
        value: cm.getValue()
      })
    })
  }

  async parse (): Promise<string> {
    this.value = this.cm.getValue()
    this.html = this.parser.parse(this.value)

    return this.html
  }

  render (): HTMLStencilElement {
    return (
      <Host>
        {this.theme && this.theme !== 'default'
          ? [
              // eslint-disable-next-line react/jsx-key
              <base href="/" />,
              // eslint-disable-next-line react/jsx-key
              <link
                rel="stylesheet"
                href={
                  this.theme.includes('://')
                    ? this.theme
                    : `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.58.3/theme/${this.theme}.min.css`
                }
              />
            ]
          : null}

        <nav class="tabs is-right">
          <ul>
            <li class={this._isEdit ? 'is-active' : ''}>
              <a
                role="button"
                onClick={() => {
                  this.setEdit(true)
                }}
              >
                Editor
              </a>
            </li>
            <li class={!this._isEdit ? 'is-active' : ''}>
              <a
                role="button"
                onClick={() => {
                  this.setEdit(false)
                }}
              >
                Preview
              </a>
            </li>
          </ul>
        </nav>

        <article class={this._isEdit ? 'hide-scrollbar' : ''}>
          <div
            style={{
              display: this._isEdit ? 'block' : 'none'
            }}
          >
            <textarea
              ref={el => {
                this.cmEl = el
                this.initCm()
              }}
              placeholder="Type in markdown to comment..."
            ></textarea>
          </div>

          <div
            class="content"
            innerHTML={this.html}
            style={{
              display: !this._isEdit ? 'block' : 'none'
            }}
          ></div>
        </article>
      </Host>
    )
  }
}
