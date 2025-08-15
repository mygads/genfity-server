import { Authors } from "@/static/authorData";
import { notFound } from "next/navigation";
import React from "react";
import TeamHeroSection from "./components/Hero";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  return Authors.map((author) => ({ id: author.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const author = Authors.find((author) => author.id === id);
  return {
    title: `${author?.name || "Author"} | GENFITY`,
    description: `${author?.name || "This author"} is a ${
      author?.designation || "contributor"
    } at GENFITY`,
  };
}

async function DynamicMembersPage({ params }: Props) {
  const { id } = await params;
  const author = Authors.find((author) => author.id === id);

  if (!author) {
    notFound();
  }

  return (
    <div className="relative z-10 overflow-hidden pt-28 lg:pt-[150px]">
      <TeamHeroSection author={author} />
    </div>
  );
}

export default DynamicMembersPage;
