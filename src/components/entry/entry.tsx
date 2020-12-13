import {
  Component,
  Element,
  Event,
  EventEmitter,
  Host,
  Prop,
  State,
  Watch,
  h
} from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'

import { Entry, initEntry } from '../../base/Entry'
import {
  EntryViewer,
  IPostChange,
  initEntryViewer
} from '../../base/EntryViewer'
import { IApi, IAuthor, IPost, IReactionType } from '../../types/base'

/**
 * @internal
 */
@Component({
  tag: 'aloud-entry',
  styleUrl: 'entry.scss',
  assetsDirs: ['../assets', '../collection/assets'],
  scoped: true
})
export class AloudEntry implements EntryViewer, Entry {
  @Prop() url!: string;
  @Prop() user?: IAuthor;
  @Prop({
    mutable: true
  })
  entry!: IPost;

  @Prop() cmTheme!: string;

  @Prop() api!: IApi;
  @Prop() depth!: number;
  @Prop() parser!: {
    parse: (md: string) => string;
  };

  @Prop() isSmallScreen!: boolean;
  @Prop() realtimeUpdates!: IPostChange[];

  @Element() $el: HTMLElement;

  isVisible = false;
  visibleObserver: IntersectionObserver;

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
  @State() subEntries = new Map<
    string,
    {
      count: number;
    }
  >();

  readonly limit = 2;

  getReaction: (r: IReactionType) => string[];
  setReaction: (r: IReactionType) => Promise<void>;
  getSmallNav: (showAuthor: boolean) => HTMLElement;

  subEntryCountListener = (p: { entryId: string; count: number }): void => {
    this.subEntries.set(p.entryId, { count: p.count })
  };

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;

  doOnRealtimeChange: () => Promise<void>;

  get subEntriesLength (): number {
    return Array.from(this.subEntries.values()).reduce(
      (prev, c) => prev + c.count,
      0
    )
  }

  get maxDepth (): number {
    if (this.isSmallScreen) {
      return 1
    }

    return 2
  }

  componentWillLoad (): void {
    initEntryViewer(this, this.$el)
    initEntry(this)
    this.doLoad(true)
  }

  @Watch('realtimeUpdates')
  onRealtimeChange (): void {
    this.doOnRealtimeChange()
  }

  render (): HTMLStencilElement {
    return (
      <Host class="media">
        <figure
          class="media-left"
          style={{ visibility: this.entry.isDeleted ? 'hidden' : '' }}
        >
          <p class="image is-48x48">
            {this.entry.isDeleted ? null : (
              <img
                src={this.entry.author.image}
                alt={this.entry.author.name}
                title={this.entry.author.name}
              />
            )}
          </p>
        </figure>
        <div class="media-content">
          {this.entry.isDeleted ? (
            <i class="is-deleted">Deleted</i>
          ) : (
            [
              // eslint-disable-next-line react/jsx-key
              <div class="content">
                <h5>
                  {this.entry.author.name}
                  {this.entry.author.id === this.user?.id ? (
                    <i>{' (me)'}</i>
                  ) : null}
                </h5>
                {this.isEdit ? (
                  <aloud-editor
                    parser={this.parser}
                    theme={this.cmTheme}
                    value={this.entry.markdown}
                    onCmChange={ev => (this.editorValue = ev.detail.value)}
                  />
                ) : (
                  <div
                    role="button"
                    onClick={() => {
                      this.isExpanded = true
                    }}
                    innerHTML={(() => {
                      if (this.isExpanded || !this.isSmallScreen) {
                        return this.parser.parse(this.entry.markdown)
                      }

                      const isMarkdownTooBig = this.entry.markdown.length > 140

                      const body = document.createElement('body')
                      body.innerHTML = this.parser.parse(
                        this.entry.markdown.slice(0, 140)
                      )

                      if (isMarkdownTooBig) {
                        const { lastElementChild }
                          = body.firstElementChild || {}

                        if (lastElementChild instanceof HTMLParagraphElement) {
                          lastElementChild.innerHTML += '...'
                        } else {
                          body.innerHTML += '...'
                        }
                      }

                      return body.innerHTML
                    })()}
                  />
                )}

                {this.getSmallNav(false)}
              </div>,
              this.isReply ? (
                <aloud-editor
                  parser={this.parser}
                  theme={this.cmTheme}
                  onCmChange={ev => (this.replierValue = ev.detail.value)}
                ></aloud-editor>
              ) : null
            ]
          )}

          {this.children.map(it =>
            this.depth > this.maxDepth ? (
              <aloud-subentry
                url={this.url}
                parser={this.parser}
                user={this.user}
                parent={this.entry.author}
                entry={it}
                api={this.api}
                limit={this.limit}
                isSmallScreen={this.isSmallScreen}
                totalSubEntriesLength={this.subEntriesLength}
                countChangedListener={this.subEntryCountListener}
                cmTheme={this.cmTheme}
                realtimeUpdates={this.realtimeUpdates}
                onDelete={evt => this.doDelete(evt.detail)}
                onChildrenCountChanged={evt =>
                  this.subEntryCountListener(evt.detail)
                }
              ></aloud-subentry>
            ) : (
              <aloud-entry
                url={this.url}
                parser={this.parser}
                user={this.user}
                entry={it}
                api={this.api}
                depth={this.depth + 1}
                isSmallScreen={this.isSmallScreen}
                cmTheme={this.cmTheme}
                realtimeUpdates={this.realtimeUpdates}
                onDelete={evt => this.doDelete(evt.detail)}
              ></aloud-entry>
            )
          )}

          {this.hasMore ? (
            <button
              class="more"
              type="button"
              onClick={() => this.doLoad(true)}
            >
              Click for more
            </button>
          ) : null}
        </div>
      </Host>
    )
  }
}
