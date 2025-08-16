import { Author } from "@/types/Author";
import Image from "next/image";

function TeamHeroSection({ author }: { author: Author }) {
  return (
    <main className="container min-h-screen">
      <div className="flex flex-col items-center justify-center">
        <Image
          src={author.image}
          alt={author.name}
          width={400}
          height={400}
          className="rounded-2xl"
        />
        <h1 className="mt-10 text-4xl font-bold">{author.name}</h1>
        <p className="mt-2 text-base text-gray-500">{author.designation}</p>
      </div>
    </main>
  );
}

export default TeamHeroSection;
