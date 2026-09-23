export interface SparkQuestionDefinition {
  question: string;
  category: "Romantic" | "Memories" | "Deep" | "Fun" | "Future";
}

export const SPARK_QUESTIONS: SparkQuestionDefinition[] = [
  // Romantic
  { question: "What is a small thing I did recently that made you feel deeply loved?", category: "Romantic" },
  { question: "When did you first realize you had genuine feelings for me?", category: "Romantic" },
  { question: "What is your favorite physical feature or expression of mine?", category: "Romantic" },
  { question: "What is one little quirk of mine that you secretly adore?", category: "Romantic" },
  { question: "If you had to describe our connection in three words, what would they be?", category: "Romantic" },
  { question: "What was the sweetest surprise or gesture I've ever done for you?", category: "Romantic" },
  { question: "What song instantly makes you think of us whenever you hear it?", category: "Romantic" },
  { question: "What is your favorite way to cuddle or spend quiet time together?", category: "Romantic" },
  { question: "What makes you feel the most appreciated and seen by me?", category: "Romantic" },
  { question: "What is a romantic date night you've been secretly wishing we'd go on?", category: "Romantic" },
  { question: "What is one compliment from me that you'll never forget?", category: "Romantic" },
  { question: "How do you feel our love has grown since we first got together?", category: "Romantic" },
  { question: "What is one habit of ours as a couple that you cherish the most?", category: "Romantic" },
  { question: "What is something I say or do that never fails to give you butterflies?", category: "Romantic" },
  { question: "If you could freeze one romantic moment between us forever, which one would it be?", category: "Romantic" },
  { question: "What is something you wish I kissed or touched you more often?", category: "Romantic" },

  // Memories
  { question: "What is your single favorite memory of us from this past year?", category: "Memories" },
  { question: "What was your honest first impression of me the day we met?", category: "Memories" },
  { question: "What is our funniest shared memory that still makes you burst out laughing?", category: "Memories" },
  { question: "Which trip or adventure that we took together was your favorite and why?", category: "Memories" },
  { question: "What is a meal we shared together that you still daydream about?", category: "Memories" },
  { question: "What was the moment you felt the proudest of me?", category: "Memories" },
  { question: "What is a funny inside joke between us that no one else would ever understand?", category: "Memories" },
  { question: "What was our best late-night conversation about?", category: "Memories" },
  { question: "Which photo of the two of us is your absolute favorite and why?", category: "Memories" },
  { question: "What is a silly or chaotic challenge we tackled together that made us closer?", category: "Memories" },
  { question: "What was the most spontaneous thing we've ever done together?", category: "Memories" },
  { question: "What is a gift I gave you that meant the absolute world to you?", category: "Memories" },
  { question: "What is a rainy or cozy day we spent together that stands out in your mind?", category: "Memories" },

  // Deep
  { question: "What is one fear or insecurity you've felt safe enough to share with me?", category: "Deep" },
  { question: "In what way have I helped you grow into a better version of yourself?", category: "Deep" },
  { question: "What is something you're currently stressed about that I could support you with?", category: "Deep" },
  { question: "What does true emotional intimacy mean to you in our relationship?", category: "Deep" },
  { question: "What is a value or principle of mine that you deeply respect?", category: "Deep" },
  { question: "When you have a tough day, what can I do that brings you the most comfort?", category: "Deep" },
  { question: "What is a part of your childhood or past you wish I knew even more about?", category: "Deep" },
  { question: "What does our partnership provide you that you never had before?", category: "Deep" },
  { question: "What is a personal dream of yours that you want us to accomplish together?", category: "Deep" },
  { question: "How do you feel we handle disagreements, and how can we be even gentler with each other?", category: "Deep" },
  { question: "What is one thing you are most grateful for in your life right now?", category: "Deep" },
  { question: "What is something vulnerable you've been wanting to tell me lately?", category: "Deep" },

  // Fun
  { question: "If we were contestants on a couple reality show, what would our team strategy be?", category: "Fun" },
  { question: "Who takes longer to get ready in the morning, and who takes longer to decide on food?", category: "Fun" },
  { question: "If we had an entire Sunday with zero phones, zero chores, and unlimited budget, what are we doing?", category: "Fun" },
  { question: "What is a silly habit or obsession of mine that makes you chuckle?", category: "Fun" },
  { question: "If we swapped bodies for 24 hours, what is the first thing you would do?", category: "Fun" },
  { question: "Which movie or TV couple reminds you the most of our dynamic?", category: "Fun" },
  { question: "If you had to describe our relationship as a dessert, what would it be?", category: "Fun" },
  { question: "What is the worst fashion or haircut phase you've ever had?", category: "Fun" },
  { question: "Who is more likely to accidentally burn dinner, and who is more likely to buy useless gadgets?", category: "Fun" },
  { question: "What is our official couple guilty pleasure guilty song or show?", category: "Fun" },
  { question: "If we opened a little cafe or boutique together, what would we name it?", category: "Fun" },
  { question: "If we were stranded on a desert island, which one of us survives longer?", category: "Fun" },

  // Future
  { question: "What is the #1 destination in the world you want us to travel to next?", category: "Future" },
  { question: "What is one tradition you want us to build and celebrate every single year?", category: "Future" },
  { question: "Where do you picture us living in 5 years, and what does our ideal morning look like?", category: "Future" },
  { question: "What is a new hobby, skill, or sport you'd love for us to learn together?", category: "Future" },
  { question: "What is one big bucket list goal you want us to check off before next year?", category: "Future" },
  { question: "What is something exciting about our future that gives you butterflies when you think about it?", category: "Future" },
  { question: "If we bought our dream vacation cottage tomorrow, where would it be located?", category: "Future" },
  { question: "What is one little promise you want us to make to each other for the year ahead?", category: "Future" },
  { question: "What kind of legacy or impact do you want our relationship to have on the people around us?", category: "Future" },
  { question: "When we are 80 years old sitting on a porch together, what will we laugh about the most?", category: "Future" },
];

/**
 * Deterministically pick a question based on the date string (YYYY-MM-DD).
 * Ensures both partners get the identical question without extra coordination.
 */
export function getQuestionForDate(dateStr: string): SparkQuestionDefinition {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SPARK_QUESTIONS.length;
  return SPARK_QUESTIONS[index];
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
