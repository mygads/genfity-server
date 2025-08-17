import { Author } from "@/types/Author";

export const Authors: Author[] = [
  {
    name: "Abin Justinkumaravel",
    id: "abin-justinkumaravel",
    image:
      "https://miro.medium.com/v2/resize:fill:176:176/1*4GxdlQtFyGam2Ye62AZf4Q.jpeg",
    designation: "AI Researcher",
    external_link: "https://medium.com/@abinj2003",
  },
  {
    name: "Karthikeyan",
    id: "karthikeyan",
    image: "https://karthikeyanj.netlify.app/assets/karthikeyan-QrG062tz.png",
    designation: "Frontend Team Lead",
    external_link: "https://medium.com/@karthikeyanj1915",
  },
  {
    name: "Maneesh",
    id: "maneesh",
    image: "",
    designation: "Backend Team Lead",
    external_link: "https://medium.com/@abinj2003",
  },
];

export const getAllAuthorsLinks = () =>
  Authors.map((author) => ({
    name: author.name,
    link: "/team/" + author.id,
  }));
