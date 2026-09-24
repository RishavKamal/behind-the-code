const articles = [
  {
    id: 1,
    slug: "understanding-hashmap-in-java",
    category: "Java",
    title: "Understanding HashMap in Java",
    excerpt:
      "Breaking down how HashMap works, how data is stored, and why its operations are generally considered O(1).",

    publishedAt: "2026-09-24",
    readTimeMinutes: 6,
    published: true,

    content: [
      {
        type: "paragraph",
        text: "HashMap is one of the most commonly used data structures in Java. It allows us to store data in key-value pairs and retrieve a value using its associated key.",
      },
      {
        type: "heading",
        text: "What is a HashMap?",
      },
      {
        type: "paragraph",
        text: "A HashMap stores elements as key-value pairs. Each key is unique, while multiple keys can point to different values.",
      },
      {
        type: "code",
        language: "java",
        code: `import java.util.HashMap;

HashMap<String, Integer> marks = new HashMap<>();

marks.put("Java", 90);
marks.put("DSA", 85);
marks.put("React", 80);`,
      },
      {
        type: "paragraph",
        text: "In this example, the strings are keys and the integers are their corresponding values.",
      },
      {
        type: "heading",
        text: "How does HashMap work?",
      },
      {
        type: "paragraph",
        text: "Internally, HashMap uses a hash table. When we insert a key-value pair, Java calculates a hash for the key and uses it to determine where the entry should be stored.",
      },
      {
        type: "heading",
        text: "Why is HashMap usually O(1)?",
      },
      {
        type: "paragraph",
        text: "Because the hash function helps Java locate the appropriate bucket quickly, insertion and lookup are generally considered O(1) on average.",
      },
      {
        type: "heading",
        text: "Example",
      },
      {
        type: "code",
        language: "java",
        code: `HashMap<Integer, String> students = new HashMap<>();

students.put(101, "Ravi");
students.put(102, "Aman");

System.out.println(students.get(101));`,
      },
      {
        type: "paragraph",
        text: "The get operation uses the key to find the corresponding value. This is one of the main reasons HashMap is useful when fast key-based lookups are required.",
      },
      {
        type: "heading",
        text: "Final thoughts",
      },
      {
        type: "paragraph",
        text: "HashMap is more than just a convenient collection. Understanding how hashing, buckets, collisions, and lookup work gives a much better understanding of what happens behind the code.",
      },
    ],
  },

  {
    id: 2,
    slug: "my-first-rest-api-with-spring-boot",
    category: "Spring Boot",
    title: "Understanding My First REST API",
    excerpt:
      "A practical look at creating a REST API with Spring Boot and understanding what happens behind each request.",

    publishedAt: "2026-09-22",
    readTimeMinutes: 8,
    published: true,

    content: [
      {
        type: "paragraph",
        text: "A REST API allows different applications to communicate over HTTP. When I started working with Spring Boot, understanding this request-response flow was one of the first important steps.",
      },
      {
        type: "heading",
        text: "What is a REST API?",
      },
      {
        type: "paragraph",
        text: "A REST API exposes resources through HTTP endpoints. A client sends a request and the server processes it before returning a response.",
      },
      {
        type: "heading",
        text: "A simple Spring Boot endpoint",
      },
      {
        type: "code",
        language: "java",
        code: `@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot!";
    }
}`,
      },
      {
        type: "paragraph",
        text: "The controller receives a GET request and returns a response to the client.",
      },
      {
        type: "heading",
        text: "Understanding the request flow",
      },
      {
        type: "paragraph",
        text: "The browser or frontend sends an HTTP request to the endpoint. Spring Boot maps that request to the appropriate controller method, executes the logic, and sends the result back.",
      },
      {
        type: "heading",
        text: "Final thoughts",
      },
      {
        type: "paragraph",
        text: "Once the basic request-response cycle becomes clear, concepts such as services, repositories, databases, authentication, and validation become much easier to understand.",
      },
    ],
  },

  {
    id: 3,
    slug: "how-i-approach-a-leetcode-problem",
    category: "DSA",
    title: "How I Approach Solving a LeetCode Problem",
    excerpt:
      "The process I use to understand a problem, identify the right approach, write the solution, and analyze its complexity.",

    publishedAt: "2026-09-20",
    readTimeMinutes: 5,
    published: true,

    content: [
      {
        type: "paragraph",
        text: "Solving a DSA problem is not only about writing code. The first challenge is understanding what the problem is actually asking.",
      },
      {
        type: "heading",
        text: "Read the problem carefully",
      },
      {
        type: "paragraph",
        text: "Before thinking about an algorithm, I first identify the input, expected output, constraints, and important edge cases.",
      },
      {
        type: "heading",
        text: "Find the pattern",
      },
      {
        type: "paragraph",
        text: "The next step is to look for patterns. Depending on the problem, the solution might involve arrays, hashing, two pointers, binary search, recursion, graphs, or dynamic programming.",
      },
      {
        type: "heading",
        text: "Write the solution",
      },
      {
        type: "paragraph",
        text: "After identifying the approach, I write the simplest correct solution first and then analyze whether it can be improved.",
      },
      {
        type: "heading",
        text: "Analyze complexity",
      },
      {
        type: "paragraph",
        text: "Finally, I consider the time and space complexity and compare them with the constraints given in the problem.",
      },
    ],
  },

  {
    id: 4,
    slug: "what-i-learned-building-my-first-react-project",
    category: "React",
    title: "What I Learned Building My First React Project",
    excerpt:
      "Lessons from working with components, props, state, routing, and structuring a React application.",

    publishedAt: "2026-09-18",
    readTimeMinutes: 7,
    published: true,

    content: [
      {
        type: "paragraph",
        text: "Building a React project helped me understand that frontend development is not just about creating interfaces. The way an application is structured becomes increasingly important as it grows.",
      },
      {
        type: "heading",
        text: "Components",
      },
      {
        type: "paragraph",
        text: "Components allow an application to be divided into smaller, reusable pieces. This makes individual parts easier to understand and maintain.",
      },
      {
        type: "heading",
        text: "Props and state",
      },
      {
        type: "paragraph",
        text: "Props allow data to move into components, while state allows components to keep track of changing information.",
      },
      {
        type: "heading",
        text: "Routing",
      },
      {
        type: "paragraph",
        text: "React Router makes it possible to create multiple pages and URLs while keeping the application as a single-page application.",
      },
    ],
  },

  {
    id: 5,
    slug: "building-my-developer-portfolio",
    category: "Projects",
    title: "How I Built My Developer Portfolio with React",
    excerpt:
      "Building a developer portfolio taught me more than just React. Here's what I learned about components, routing, UI structure, and turning an idea into a real project.",

    publishedAt: "2026-09-23",
    readTimeMinutes: 7,
    published: true,

    content: [
      {
        type: "paragraph",
        text: "A portfolio looks simple from the outside, but building one from scratch involves many decisions about structure, design, responsiveness, and performance.",
      },
      {
        type: "heading",
        text: "Starting with the structure",
      },
      {
        type: "paragraph",
        text: "I started by breaking the portfolio into sections and reusable React components rather than putting everything into one large component.",
      },
      {
        type: "heading",
        text: "Working with React",
      },
      {
        type: "paragraph",
        text: "React made it easier to separate the interface into components and manage the different parts of the page independently.",
      },
      {
        type: "heading",
        text: "What I learned",
      },
      {
        type: "paragraph",
        text: "The biggest lesson was that building a real project forces you to think beyond individual technologies. Structure, user experience, debugging, and deployment all become part of the development process.",
      },
    ],
  },

  {
    id: 6,
    slug: "debugging-react-errors",
    category: "Debugging",
    title: "How I Debug React Errors",
    excerpt:
      "A practical approach to understanding React errors instead of randomly changing code until something works.",

    publishedAt: "2026-09-16",
    readTimeMinutes: 6,
    published: true,

    content: [
      {
        type: "paragraph",
        text: "Debugging is a large part of software development. React errors can initially look confusing, but most of them provide useful information about what went wrong.",
      },
      {
        type: "heading",
        text: "Read the error first",
      },
      {
        type: "paragraph",
        text: "The first step is to read the complete error message instead of immediately changing the code.",
      },
      {
        type: "heading",
        text: "Find where the error starts",
      },
      {
        type: "paragraph",
        text: "The stack trace usually provides a useful starting point. I look for the first part of the trace that points toward code written in the application.",
      },
      {
        type: "heading",
        text: "Fix the cause",
      },
      {
        type: "paragraph",
        text: "Instead of changing multiple things at once, I try to isolate the actual cause and make one change at a time.",
      },
    ],
  },
];

export default articles;