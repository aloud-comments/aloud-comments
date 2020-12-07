import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/css/css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/mode/overlay';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/display/placeholder';
import { Component, Host, Method, Prop, State, h } from '@stencil/core';
import CodeMirror from 'codemirror';
/**
 * @internal
 */
export class Editor {
  constructor() {
    /**
     * Markdown to be parsed in-and-out of the editor
     *
     * Use `.getValue()` to get and update the value
     */
    this.value = '';
    this.html = '';
    this._isEdit = true;
  }
  setEdit(b) {
    this._isEdit = b;
    if (!b) {
      this.parse();
    }
    else if (this.cm) {
      this.cm.setValue(this.value);
    }
  }
  async initCm() {
    if (this.cm) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
    const shiftTabs = (d) => {
      const spaces = Array(this.cm.getOption('indentUnit') + d).join(' ');
      const doc = this.cm.getDoc();
      const { line: startLine } = this.cm.getCursor();
      const endPoint = this.cm.getCursor('to');
      const lines = doc
        .getRange({ ch: 0, line: startLine }, endPoint)
        .split(/\n/g)
        .map(r => spaces + r);
      doc.replaceRange(lines.join('\n'), { ch: 0, line: startLine }, endPoint);
    };
    this.cm = CodeMirror.fromTextArea(this.cmEl, {
      mode: 'markdown',
      autoCloseBrackets: true,
      lineWrapping: true,
      tabSize: 4,
      extraKeys: {
        Tab: () => shiftTabs(1),
        'Shift-Tab': () => shiftTabs(-1)
      }
    });
    this.cm.setValue(this.value);
  }
  async getValue() {
    this.value = this.cm.getValue();
    return this.value;
  }
  async parse() {
    this.value = this.cm.getValue();
    this.html = this.parser.parse(this.value);
    return this.html;
  }
  render() {
    return (h(Host, null,
      h("nav", { class: "tabs is-right" },
        h("ul", null,
          h("li", { class: this._isEdit ? 'is-active' : '' },
            h("a", { role: "button", onClick: () => {
                this.setEdit(true);
              } }, "Editor")),
          h("li", { class: !this._isEdit ? 'is-active' : '' },
            h("a", { role: "button", onClick: () => {
                this.setEdit(false);
              } }, "Preview")))),
      h("article", { class: this._isEdit ? 'hide-scrollbar' : '' },
        h("div", { style: {
            display: this._isEdit ? 'block' : 'none'
          } },
          h("textarea", { ref: el => {
              this.cmEl = el;
              this.initCm();
            }, placeholder: "Type in markdown to comment..." })),
        h("div", { class: "content", innerHTML: this.html, style: {
            display: !this._isEdit ? 'block' : 'none'
          } }))));
  }
  static get is() { return "aloud-editor"; }
  static get encapsulation() { return "shadow"; }
  static get originalStyleUrls() { return {
    "$": ["editor.scss"]
  }; }
  static get styleUrls() { return {
    "$": ["editor.css"]
  }; }
  static get properties() { return {
    "value": {
      "type": "string",
      "mutable": true,
      "complexType": {
        "original": "string",
        "resolved": "string",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Markdown to be parsed in-and-out of the editor\n\nUse `.getValue()` to get and update the value"
      },
      "attribute": "value",
      "reflect": true,
      "defaultValue": "''"
    },
    "firebase": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "IFirebaseConfig",
        "resolved": "{ [k: string]: unknown; }",
        "references": {
          "IFirebaseConfig": {
            "location": "import",
            "path": "../aloud-comments/aloud-comments"
          }
        }
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "parser": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "{\n    parse: (md: string) => string;\n  }",
        "resolved": "{ parse: (md: string) => string; }",
        "references": {}
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    }
  }; }
  static get states() { return {
    "html": {},
    "_isEdit": {}
  }; }
  static get methods() { return {
    "getValue": {
      "complexType": {
        "signature": "() => Promise<string>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          }
        },
        "return": "Promise<string>"
      },
      "docs": {
        "text": "",
        "tags": []
      }
    }
  }; }
}
