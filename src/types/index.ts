export interface IAuthor {
  id: string;
  name: string;
  image: string;
  gender?: 'male' | 'female';
}

export type IAuthorNormalized = IAuthor;

export type IReactionType = 'like' | 'dislike' | 'bookmark';

export const ReactionTypes: IReactionType[] = ['like', 'dislike', 'bookmark']

export type IReaction = {
  [t in IReactionType]: string[];
};

export interface IPost extends IReaction {
  url: string;
  id: string;
  parentId?: string;
  author: IAuthor;
  markdown: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export type IPostNormalized = Omit<IPost, 'author'> & {
  parentId: string;
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
  post: (p: {
    url: string;
    authorId: string;
    parentId?: string;
    markdown: string;
  }) => Promise<{
    entryId: string;
  }>;
  update: (p: {
    entryId: string;
    markdown: string;
  }) => Promise<{
    isUpdated: boolean;
  }>;
  reaction: (p: {
    entryId: string;
    userId: string;
    reaction: IReactionType;
  }) => Promise<IReaction>;
  delete: (p: {
    entryId: string;
  }) => Promise<{
    status: 'deleted' | 'suppressed';
  }>;
}
