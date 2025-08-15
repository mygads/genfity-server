"use client";

import SectionTitle from "../Common/SectionTitle";
import { InteractiveHoverButton } from "../ui/interactive-hover-button";
import SingleBlog from "./SingleBlog";
import blogData from "@/static/blogData";

const Blog = () => {
  return (
    <section
      id="blog"
      className="bg-gray-light dark:bg-bg-color-dark py-16 md:py-20 lg:py-28"
    >
      <div className="container">
        <SectionTitle
          title="Our Latest Blogs"
          paragraph="Stay ahead of the curve with our latest blog posts. We provide in-depth articles, case studies, and expert insights on technology, innovation, AI, and business strategies to help you transform and grow."
          center
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:gap-x-6 lg:gap-x-8 xl:grid-cols-3">
          {blogData.slice(1).map((blog) => (
            <div key={blog.id} className="w-full">
              <SingleBlog blog={blog} />
            </div>
          ))}
        </div>
        <div className="flex justify-center w-full mt-12">
          <div className="text-center w-52">
            <InteractiveHoverButton link="/blog" text="More Blogs" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blog;
