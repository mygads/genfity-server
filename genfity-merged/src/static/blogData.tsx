import { Blog } from "@/types/blog";
import { Authors } from "./authorData";

const blogData: Blog[] = [
  {
    id: 1,
    title: "WOW, Is this real? Is AI Revolutionizing in Ayurveda?",
    paragraph:
      "Usually, we all imagine the future of Health Care, Do we think anything about traditional Ayurveda techniques? No right, Here is the creative Idea, I researched.",
    image:
      "https://miro.medium.com/v2/resize:fit:720/format:webp/1*pS9_ZB7828QSWtQ1xJUoIg.jpeg",
    author: Authors.find((a) => (a.name = "Abin Justinkumaravel")),
    tags: ["AI", "Ayurveda", "Machine Learning"],
    publishDate: "Jul 13, 2024",
    external_link:
      "https://medium.com/@abinj2003/wow-is-this-real-is-ai-revolutionizing-in-ayurveda-4bf2aa58045d",
  },
  {
    id: 2,
    title:
      "Introduction to Machine Learning: Why is Machine Learning Important?",
    paragraph:
      "Hey guys, welcome back to another blog. In this blog, we will explore and get a deep understanding of Why machine learning and where we use it. If you are a beginner in machine learning, this blog will be handy.",
    image:
      "https://miro.medium.com/v2/resize:fit:720/format:webp/1*VzegkAgYolkRN3JXeQCSEg.png",
    author: Authors.find((a) => (a.name = "Abin Justinkumaravel")),
    tags: ["AI", "Computer Science", "Machine Learning"],
    publishDate: "Jul 13, 2024",
    external_link:
      "https://medium.com/@abinj2003/introduction-to-machine-learning-why-is-machine-learning-important-aa3217808b59",
  },
  {
    id: 3,
    title: "Introduction to Machine Learning: Let's Understand the Categories",
    paragraph:
      "Have you ever wondered how two simple numbers, zero and one, can transform the world? Think about it — these numbers can automate tasks in your business, guide you through tough decisions, or even replace some human jobs in the future. ",
    image:
      "https://miro.medium.com/v2/resize:fit:640/format:webp/1*WWIB8NdEtD_avQZzLxWZug.jpeg",
    author: Authors.find((a) => (a.name = "Abin Justinkumaravel")),
    tags: ["Machine Learning", "Beginner", "Artificialintelligence"],
    publishDate: "Jul 6, 2024",
    external_link:
      "https://medium.com/@abinj2003/lets-understand-machine-learning-dc347f7670aa",
  },
  {
    id: 4,
    title: "Build Your Own Weather App: A Step-by-Step Guide using JavaScript",
    paragraph:
      "Do you ever wake up in the morning wondering if you should grab an umbrella or shorts? With a basic weather app, you can have the answer at your fingertips! In this blog post, we'll guide you through creating a simple weather app using HTML, CSS, and JavaScript.",
    image:
      "https://miro.medium.com/v2/resize:fit:720/format:webp/1*tNXjpHRy0KayYG3QZcsPkw.jpeg",
    author: Authors.find((a) => (a.name = "Abin Justinkumaravel")),
    tags: ["JavaScript", "Website Development", "Weather Apps", "Programing"],
    publishDate: "Jul 6, 2024",
    external_link:
      "https://medium.com/@abinj2003/build-your-own-weather-app-a-step-by-step-guide-using-javascript-2ebe6db5643c",
  },
];
export default blogData;
