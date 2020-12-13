import { IAuthorNormalized, IPostNormalized } from '../types/base'
import { DebuggableAPI, cryptoRandomId } from '../types/debug'

class MyDexie extends window.Dexie {
  /**
   * * version 5: ^0.3.0
   */
  static version = 5;
  static dbname = 'aloud-comments';

  public authors: Dexie.Table<IAuthorNormalized, string>;
  public posts: Dexie.Table<IPostNormalized, string>;

  static async create () {
    try {
      const tempDb = await new window.Dexie(MyDexie.dbname).open()
      if (tempDb.verno < MyDexie.version) await tempDb.delete()
      tempDb.close()
    } catch (_) {}

    return new MyDexie()
  }

  private constructor () {
    super(MyDexie.dbname)

    this.version(MyDexie.version).stores({
      authors: 'id',
      posts: 'id, [parentId+url], parentId, url, createdAt'
    })

    this.authors = this.table('authors')
    this.posts = this.table('posts')
  }
}

export class DexieAPI extends DebuggableAPI {
  private db!: MyDexie;

  /**
   * @override
   */
  async populateDebug (urls: string[]): Promise<void> {
    this.db = await MyDexie.create()

    await super.populateDebug(urls)
  }

  async getAuthorIds (): Promise<string[]> {
    const keys: string[] = []

    await this.db.authors
      .filter(() => true)
      .eachPrimaryKey(k => {
        keys.push(k)
      })

    return keys
  }

  async addAuthor ({
    id = cryptoRandomId(),
    ...a
  }: Omit<IAuthorNormalized, 'id'> & {
    id?: string;
  }): Promise<IAuthorNormalized> {
    await this.db.authors.add({
      ...a,
      id
    })

    return {
      ...a,
      id
    }
  }

  async getAuthor (id: string): Promise<IAuthorNormalized | null> {
    return this.db.authors.get(id)
  }

  async addPost ({
    id = cryptoRandomId(),
    ...a
  }: Omit<IPostNormalized, 'id'> & { id?: string }): Promise<IPostNormalized> {
    await this.db.posts.add({
      ...a,
      id
    })

    return {
      ...a,
      id
    }
  }

  async getPost (id: string): Promise<IPostNormalized | null> {
    return this.db.posts.get(id)
  }

  async findPosts (
    p: Partial<IPostNormalized>,
    {
      after,
      limit = 3
    }: {
      after?: number;
      limit: number;
    }
  ): Promise<{
    result: IPostNormalized[];
    hasMore: boolean;
  }> {
    let out = await this.db.posts.where(p).reverse().sortBy('createdAt')

    const i = after ? out.map(({ createdAt }) => createdAt).indexOf(after) : -1
    if (i !== -1) {
      out = out.slice(i + 1)
    }

    return {
      hasMore: out.length > limit,
      result: out.slice(0, limit)
    }
  }

  async countPosts (p: Partial<IPostNormalized>): Promise<number> {
    return this.db.posts.where(p).count()
  }

  async updatePost (
    id: string,
    p: Partial<Omit<IPostNormalized, 'id'>>
  ): Promise<boolean> {
    const r = await this.db.posts.update(id, p)
    return !!r
  }

  async deletePost (id: string): Promise<boolean> {
    const r = await this.db.posts.where('id').equals(id).delete()
    return !!r
  }
}
