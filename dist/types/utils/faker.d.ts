export declare const sAuthor: import("jsonschema-definer").ObjectSchema<{
  id: string;
  name: string;
  image: string;
  gender: string;
}, true>;
export declare type IAuthor = typeof sAuthor.type;
export declare const sPost: import("jsonschema-definer").ObjectSchema<{
  id: string;
  author: {
    id: string;
    name: string;
    image: string;
    gender: string;
  };
  markdown: string;
  createdAt: number;
  updatedAt: number;
}, true>;
export declare type IPost = typeof sPost.type;
export declare function randomAuthor(): IAuthor;
export declare function randomPost(within?: Date): Omit<IPost, 'author'>;
