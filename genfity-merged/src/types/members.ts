import { Blog } from "./blog";

export type member = {
  name: string;
  role: string;
  profession: string;
  imageUrl: string;
  slug: string;
  blogs: Blog[];
  socialLinks: Partial<{
    instagram: string;
    linkedIn: string;
    portfolio: string;
  }>;
};
