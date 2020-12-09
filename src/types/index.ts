export interface IAuthor {
  id: string;
  name: string;
  image: string;
  gender?: 'male' | 'female';
}

export type IAuthorNormalized = IAuthor;

export type IReactionType = 'like' | 'dislike' | 'bookmark';

export const ReactionTypes: IReactionType[] = ['like', 'dislike', 'bookmark']

export interface IPost {
  url: string;
  id: string;
  parentId: string | null;
  author: IAuthor;
  markdown: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  reaction?: {
    [t in IReactionType]: Set<string>;
  };
}

export type IPostNormalized = Omit<IPost, 'author'> & {
  authorId: string;
};

export interface IApi {
  get: (p: {
    url: string;
    parentId: string | null;
    after?: string;
    limit?: number;
  }) => Promise<{
    result: IPost[];
    hasMore: boolean;
  }>;
  post?: (p: {
    url: string;
    authorId: string;
    parentId?: string;
    markdown: string;
  }) => Promise<{
    entryId: string;
  }>;
  update?: (p: { entryId: string; markdown: string }) => Promise<void>;
  reaction?: (p: {
    entryId: string;
    userId: string;
    reaction: IReactionType;
  }) => Promise<{
    changes: {
      [t in IReactionType]?: number;
    };
  }>;
  delete?: (p: {
    entryId: string;
  }) => Promise<{
    status: 'deleted' | 'suppressed';
  }>;
}

export type IFirebaseConfig = {
  [k: string]: unknown;
};
