import { getAllAuthorsLinks } from "@/static/authorData";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Team",
};

function MembersPage() {
  const authors = getAllAuthorsLinks();

  return (
    <div className="relative z-10 overflow-hidden pt-28 lg:pt-[150px]">
      <section className="container  min-h-screen">
        <div className="flex flex-col items-center justify-center gap-4">
          {authors.map((i) => (
            <Link href={i.link} key={i.name}>
              {i.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MembersPage;
