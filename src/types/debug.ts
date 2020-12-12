import { IApi, IAuthor, IAuthorNormalized, IPostNormalized } from './base'

export function cryptoRandomId (): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)

  return buf[0].toString(36)
}

export abstract class DebuggableAPI implements IApi {
  baseURL = this.cleanURL(
    location.href.replace(/#[^/].*$/, '').replace(/#\/.*$/, '')
  );

  authorIds: string[] = [];
  firstAuthor: IAuthor;

  abstract getAuthorIds(): Promise<string[]>;
  abstract addAuthor(
    a: Omit<IAuthorNormalized, 'id'> & { id?: string },
  ): Promise<IAuthorNormalized>;

  abstract getAuthor(id: string): Promise<IAuthorNormalized | null>;

  abstract addPost(
    p: Omit<IPostNormalized, 'id'> & { id?: string },
  ): Promise<IPostNormalized>;

  abstract getPost(id: string): Promise<IPostNormalized | null>;

  abstract findPosts(
    p: Partial<IPostNormalized>,
    opts: {
      after?: string;
      limit: number;
    },
  ): Promise<{
    result: IPostNormalized[];
    hasMore: boolean;
  }>;

  abstract countPosts<O>(
    p: Partial<IPostNormalized>,
    opts?: O,
  ): Promise<number>;

  abstract updatePost(
    id: string,
    p: Partial<Omit<IPostNormalized, 'id'>>,
  ): Promise<boolean>;

  abstract deletePost(id: string): Promise<boolean>;

  private cleanURL (u: string) {
    return u
      .replace(/#[^/].*$/, '')
      .replace(/#\/$/, '')
      .replace(/\/$/, '')
  }

  async populateDebug (urls: string[]): Promise<void> {
    const authorCount = 5
    const minItemsAtFirstLevel = 3

    urls = urls
      .map(u => this.cleanURL(u))
      .map(u =>
        /:\/\//.test(u)
          ? u
          : u.startsWith('/')
            ? this.baseURL + u
            : this.baseURL + '/' + u
      )

    if (!urls.includes(this.baseURL)) {
      urls.push(this.baseURL)
    }

    this.authorIds = await this.getAuthorIds()

    if (!this.authorIds.length) {
      this.authorIds = await Promise.all(
        Array(authorCount)
          .fill(null)
          .map(() => this.makeAuthor().then(a => a.id))
      )
    }

    this.firstAuthor = await this.getAuthor(this.authorIds[0])

    await Promise.all(
      urls.map(u =>
        this.countPosts({
          url: u
        }).then(async c => {
          if (!c) {
            return this.recurseGenPost(u, [], {
              minItems: minItemsAtFirstLevel
            })
          }
          return c
        })
      )
    )
  }

  private async recurseGenPost (
    url: string,
    parents: number[] = [],
    {
      minItems = 1
    }: {
      minItems?: number;
    } = {}
  ): Promise<IPostNormalized[]> {
    if (parents.length > 5) {
      return []
    }

    let hasChildren = false

    let out: IPostNormalized[] = (
      await Promise.all(
        Array(Math.floor(Math.random() ** 2 * 9) + minItems)
          .fill(null)
          .map(async (_, i) => {
            const ps = [
              await this.makePost(
                url,
                url + '--' + [...parents, i].map(j => j.toString()).join(''),
                parents.length
                  ? url + '--' + parents.map(j => j.toString()).join('')
                  : null
              )
            ]

            if (Math.random() ** 2 > 0.5) {
              hasChildren = true
              return [
                ...ps,
                ...(await this.recurseGenPost(url, [...parents, i]))
              ]
            }

            return ps
          })
      )
    ).reduce((prev, c) => [...prev, ...c], [])

    if (parents.length < 5 && !hasChildren) {
      const i = 9
      out = [
        ...out,
        await this.makePost(
          url,
          url + '--' + [...parents, i].map(j => j.toString()).join(''),
          parents.length
            ? url + '--' + parents.map(j => j.toString()).join('')
            : null
        ),
        ...(await this.recurseGenPost(url, [...parents, i]))
      ]
    }

    return out
  }

  private async makeAuthor (): Promise<IAuthor> {
    const gender = Math.random() > 0.5 ? 'female' : 'male'
    const out: IAuthorNormalized = {
      id: cryptoRandomId(),
      name: window.faker.internet.userName(),
      image: `https://joeschmoe.io/api/v1/${gender}/${Math.random()
        .toString(36)
        .substr(2)}`,
      gender
    }

    return this.addAuthor(out)
  }

  private async makePost (
    url: string,
    id = cryptoRandomId(),
    parentId?: string | null
  ): Promise<
    IPostNormalized & {
      id: string;
    }
  > {
    parentId = parentId || ''
    const parent = await this.getPost(parentId)
    if (!parent) {
      parentId = ''
    }

    const out: IPostNormalized = {
      id,
      url,
      parentId,
      authorId: this.authorIds[
        Math.floor(Math.random() ** 1.5 * this.authorIds.length)
      ],
      markdown: Array(Math.floor(Math.random() ** 1.5 * 3) + 1)
        .fill(null)
        .map(() => window.txtgen.paragraph(Math.floor(Math.random() * 3) + 1))
        .join('\n\n'),
      createdAt: parent
        ? window.faker.date.between(parent.createdAt, new Date())
        : this.makeDate(),
      like: Array(Math.floor(Math.random() ** 3 * 10))
        .fill(null)
        .map(() => Math.random().toString(36).substr(2)),
      dislike: Array(Math.floor(Math.random() ** 3 * 5))
        .fill(null)
        .map(() => Math.random().toString(36).substr(2)),
      bookmark: Array(Math.floor(Math.random() ** 3 * 10))
        .fill(null)
        .map(() => Math.random().toString(36).substr(2))
    }

    return this.addPost(out)
  }

  private makeDate (seed = Math.random()): Date {
    const now = new Date()

    if (seed < 0.5) {
      return window.faker.date.between(
        new Date(+now - 1000 * 60 * 60 * 24),
        now
      ) // within hours
    }
    if (seed < 0.8) {
      return window.faker.date.between(
        new Date(+now - 1000 * 60 * 60 * 24 * 30),
        now
      ) // within days
    }

    return window.faker.date.between(
      new Date(+now - 1000 * 60 * 60 * 24 * 365),
      now
    ) // within a years
  }

  public async get ({
    url,
    parentId,
    after,
    limit = 3
  }: Parameters<IApi['get']>[0]): ReturnType<IApi['get']> {
    parentId = parentId || ''

    const out = await this.findPosts(
      {
        parentId,
        url
      },
      {
        after,
        limit
      }
    )

    return {
      hasMore: out.hasMore,
      result: await Promise.all(
        out.result.map(async ({ authorId, ...a }) => ({
          ...a,
          author: await this.getAuthor(authorId)
        }))
      )
    }
  }

  public async post ({
    url,
    authorId,
    parentId = '',
    markdown
  }: Parameters<IApi['post']>[0]): ReturnType<IApi['post']> {
    const p = await this.addPost({
      id: cryptoRandomId(),
      url,
      authorId,
      parentId,
      markdown,
      createdAt: new Date(),
      like: [],
      dislike: [],
      bookmark: []
    })

    return {
      entryId: p.id
    }
  }

  public async update ({
    entryId,
    markdown
  }: Parameters<IApi['update']>[0]): ReturnType<IApi['update']> {
    const n = await this.updatePost(entryId, {
      markdown,
      updatedAt: new Date()
    })

    return {
      error: n ? undefined : 'not updated'
    }
  }

  public async delete ({
    entryId
  }: Parameters<IApi['delete']>[0]): ReturnType<IApi['delete']> {
    if (
      await this.countPosts({
        parentId: entryId
      })
    ) {
      await this.updatePost(entryId, {
        markdown: '*Deleted*',
        isDeleted: true
      })

      return {
        status: 'suppressed'
      }
    }

    const isDeleted = await this.deletePost(entryId)

    return isDeleted
      ? {
          status: 'deleted'
        }
      : {
          error: 'not deleted'
        }
  }

  public async reaction ({
    entryId,
    userId,
    reaction
  }: Parameters<IApi['reaction']>[0]): ReturnType<IApi['reaction']> {
    const entry = await this.getPost(entryId)

    switch (reaction) {
      case 'like':
        entry.dislike = entry.dislike.filter(el => el !== userId)
        break
      case 'dislike':
        entry.like = entry.like.filter(el => el !== userId)
    }

    if (!entry[reaction].includes(userId)) {
      entry[reaction].push(userId)
    } else {
      entry[reaction] = entry[reaction].filter(el => el !== userId)
    }

    const { like, dislike, bookmark } = entry

    await this.updatePost(entryId, {
      like,
      dislike,
      bookmark
    })

    return { like, dislike, bookmark }
  }
}
