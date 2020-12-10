import { IApi, IAuthor, IAuthorNormalized, IPostNormalized } from '../types'

class FakeAPIDatabase extends window.Dexie {
  public authors: Dexie.Table<IAuthorNormalized, string>;
  public posts: Dexie.Table<IPostNormalized, string>;

  constructor () {
    super('aloud-comments')
    this.version(1).stores({
      authors: 'id',
      posts: 'id, [parentId+url], url, createdAt'
    })
    this.authors = this.table('authors')
    this.posts = this.table('posts')
  }
}

export class FakeAPI implements IApi {
  private authors: IAuthor[] = [];

  private db = new FakeAPIDatabase();

  get user (): IAuthor {
    return this.authors[0]
  }

  static async create (urls: string[]): Promise<FakeAPI> {
    const out = new this(urls)
    await out.init()
    return out
  }

  /**
   * !_This constructor is not async'ly initialized._
   */
  private constructor (public urls: string[]) {
    const cleanURL = (u: string) =>
      u
        .replace(/#[^/].*$/, '')
        .replace(/#\/$/, '')
        .replace(/\/$/, '')

    const currentURL = cleanURL(
      location.href.replace(/#[^/].*$/, '').replace(/#\/.*$/, '')
    )

    this.urls = this.urls
      .map(cleanURL)
      .map(u =>
        /:\/\//.test(u)
          ? u
          : u.startsWith('/')
            ? currentURL + u
            : currentURL + '/' + u
      )

    if (!this.urls.includes(currentURL)) {
      this.urls.push(currentURL)
    }
  }

  private async init (): Promise<void> {
    this.authors = await this.db.authors.filter(() => true).toArray()

    if (this.authors.length < 10) {
      this.authors = await Promise.all(
        Array(10 - this.authors.length)
          .fill(null)
          .map(() => this.randomAuthor())
      )
    }

    await Promise.all(
      this.urls.map(u =>
        this.db.posts
          .where({
            url: u
          })
          .count()
          .then(async c => {
            if (!c) {
              return this.genPost(u, [], { minItems: 3 })
            }
            return c
          })
      )
    )
  }

  private async genPost (
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
              await this.randomPost(
                url,
                url + '--' + [...parents, i].map(j => j.toString()).join(''),
                parents.length
                  ? url + '--' + parents.map(j => j.toString()).join('')
                  : null
              )
            ]

            if (Math.random() ** 2 > 0.5) {
              hasChildren = true
              return [...ps, ...(await this.genPost(url, [...parents, i]))]
            }

            return ps
          })
      )
    ).reduce((prev, c) => [...prev, ...c], [])

    if (parents.length < 5 && !hasChildren) {
      const i = 9
      out = [
        ...out,
        await this.randomPost(
          url,
          url + '--' + [...parents, i].map(j => j.toString()).join(''),
          parents.length
            ? url + '--' + parents.map(j => j.toString()).join('')
            : null
        ),
        ...(await this.genPost(url, [...parents, i]))
      ]
    }

    return out
  }

  private async randomAuthor (): Promise<IAuthor> {
    const gender = Math.random() > 0.5 ? 'female' : 'male'
    const out: IAuthor = {
      id: Math.random().toString(36).substr(2),
      name: window.faker.internet.userName(),
      image: `https://joeschmoe.io/api/v1/${gender}/${Math.random()
        .toString(36)
        .substr(2)}`,
      gender
    }

    this.db.authors.add(out)

    return out
  }

  private async randomPost (
    url: string,
    id = Math.random().toString(36).substr(2),
    parentId?: string | null
  ): Promise<IPostNormalized> {
    parentId = parentId || ''
    const parent = parentId
      ? await this.db.posts
          .where({
            id: parentId
          })
          .first()
      : null
    if (!parent) {
      parentId = ''
    }

    const out: IPostNormalized = {
      url,
      parentId,
      id,
      authorId: this.authors[
        Math.floor(Math.random() ** 1.5 * this.authors.length)
      ].id,
      markdown: Array(Math.floor(Math.random() ** 1.5 * 3) + 1)
        .fill(null)
        .map(() => window.txtgen.paragraph(Math.floor(Math.random() * 3) + 1))
        .join('\n\n'),
      createdAt: parent
        ? window.faker.date.between(parent.createdAt, new Date())
        : this.randomDate(),
      reaction: {
        like: new Set(
          Array(Math.floor(Math.random() ** 3 * 10))
            .fill(null)
            .map(() => Math.random().toString(36).substr(2))
        ),
        dislike: new Set(
          Array(Math.floor(Math.random() ** 3 * 5))
            .fill(null)
            .map(() => Math.random().toString(36).substr(2))
        ),
        bookmark: new Set(
          Array(Math.floor(Math.random() ** 3 * 10))
            .fill(null)
            .map(() => Math.random().toString(36).substr(2))
        )
      }
    }

    await this.db.posts.add(out)

    return out
  }

  private randomDate (seed = Math.random()): Date {
    const now = new Date()

    // if (seed < 0.1) {
    //   return faker.date.between(new Date(+now - 1000 * 60), now); // within secs
    // }
    // if (seed < 0.3) {
    //   return faker.date.between(new Date(+now - 1000 * 60 * 60), now); // within mins
    // }
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

  /**
   * @type {IApi['get']}
   */
  public async get ({
    url,
    parentId,
    after,
    limit = 3
  }: Parameters<IApi['get']>[0]): ReturnType<IApi['get']> {
    parentId = parentId || ''

    let out = await this.db.posts
      .where({
        parentId,
        url
      })
      .reverse()
      .sortBy('createdAt')

    const i = after ? out.map(({ id }) => id).indexOf(after) : -1
    if (i !== -1) {
      out = out.slice(i + 1)
    }

    return {
      hasMore: out.length > limit,
      result: await Promise.all(
        out.slice(0, limit).map(async ({ authorId, ...a }) => ({
          ...a,
          author: await this.db.authors
            .where({
              id: authorId
            })
            .first()
        }))
      )
    }
  }
}
