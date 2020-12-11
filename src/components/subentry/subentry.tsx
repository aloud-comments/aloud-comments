import {
  Component,
  Event,
  EventEmitter,
  Host,
  Method,
  Prop,
  State,
  h
} from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'

import { Entry, initEntry } from '../../base/Entry'
import { EntryViewer, initEntryViewer } from '../../base/EntryViewer'
import { IApi, IAuthor, IPost, IReactionType } from '../../types'

/**
 * @internal
 */
@Component({
  tag: 'aloud-subentry',
  styleUrl: 'subentry.scss',
  assetsDirs: ['../assets', '../collection/assets'],
  scoped: true
})
export class AloudSubEntry implements EntryViewer, Entry {
  @Prop() url!: string;
  @Prop() user?: IAuthor;
  @Prop() parent!: IAuthor;
  @Prop({
    mutable: true
  })
  entry!: IPost;

  @Prop() cmTheme!: string;

  @Prop() api!: IApi;
  @Prop() parser!: {
    parse: (md: string) => string;
  };

  @Prop() countChangedListener!: (change: {
    entryId: string;
    count: number;
  }) => void;

  @Prop() limit!: number;
  @Prop() totalSubEntriesLength!: number;
  @Prop() isSmallScreen!: boolean;

  @Event() childrenCountChanged!: EventEmitter<{
    entryId: string;
    count: number;
  }>;

  @Event() delete!: EventEmitter<{
    entryId: string;
    hasChildren: boolean;
  }>;

  @State() isEdit = false;
  @State() isReply = false;
  @State() isExpanded = false;
  @State() children: IPost[] = [];
  @State() hasMore = true;
  @State() editorValue = '';
  @State() replierValue = '';

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;
  getReaction: (r: IReactionType) => string[];
  setReaction: (r: IReactionType) => Promise<void>;
  getSmallNav: (showAuthor: boolean) => HTMLElement;

  constructor () {
    initEntryViewer(this)
    initEntry(this)
    this.doLoad(false)
  }

  @Method()
  async getChildren (): Promise<IPost[]> {
    return this.children
  }

  render (): HTMLStencilElement {
    return (
      <Host>
        {this.entry.isDeleted ? (
          <i class="is-deleted">Deleted</i>
        ) : (
          [
            this.isEdit ? (
              <aloud-editor
                parser={this.parser}
                theme={this.cmTheme}
                value={this.entry.markdown}
                onCmChange={ev => (this.editorValue = ev.detail.value)}
              />
            ) : (
              <small
                role="button"
                onClick={() => {
                  this.isExpanded = true
                }}
                innerHTML={(() => {
                  const a = document.createElement('a')
                  a.append(
                    Object.assign(document.createElement('b'), {
                      innerText: '@' + this.parent.name + ' '
                    })
                  )

                  if (this.isExpanded || !this.isSmallScreen) {
                    return a.outerHTML + this.parser.parse(this.entry.markdown)
                  }

                  const isMarkdownTooBig = this.entry.markdown.length > 80

                  const body = document.createElement('body')
                  body.innerHTML = this.parser.parse(
                    this.entry.markdown.slice(0, 80)
                  )

                  const { firstElementChild, lastElementChild }
                    = body.firstElementChild || {}
                  if (firstElementChild instanceof HTMLParagraphElement) {
                    firstElementChild.prepend(a)
                  } else {
                    body.prepend(a)
                  }

                  if (isMarkdownTooBig) {
                    if (lastElementChild instanceof HTMLParagraphElement) {
                      lastElementChild.innerHTML += '...'
                    } else {
                      body.innerHTML += '...'
                    }
                  }

                  return body.innerHTML
                })()}
              />
            ),
            this.getSmallNav(true),
            this.isReply ? (
              <aloud-editor
                theme={this.cmTheme}
                parser={this.parser}
                onCmChange={ev => (this.replierValue = ev.detail.value)}
              ></aloud-editor>
            ) : null
          ]
        )}

        {this.children.map(it => (
          <aloud-subentry
            url={this.url}
            key={it.id}
            parser={this.parser}
            user={this.user}
            parent={this.entry.author}
            entry={it}
            api={this.api}
            limit={this.totalSubEntriesLength > 5 ? 0 : this.limit}
            isSmallScreen={this.isSmallScreen}
            totalSubEntriesLength={this.totalSubEntriesLength}
            countChangedListener={this.countChangedListener}
            cmTheme={this.cmTheme}
            onDelete={evt => this.doDelete(evt.detail)}
            onChildrenCountChanged={evt =>
              this.countChangedListener(evt.detail)
            }
          ></aloud-subentry>
        ))}

        {this.hasMore ? (
          <button class="more" type="button" onClick={() => this.doLoad(true)}>
            Click for more (to @{this.parent.name})
          </button>
        ) : null}
      </Host>
    )
  }
}
