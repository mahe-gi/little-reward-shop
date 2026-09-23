export interface SparkQuestionDefinition {
  question: string;
  category: "Cute & Flirty" | "This or That" | "Fun & Silly" | "Food & Mood" | "Little Moments";
}

export const SPARK_QUESTIONS: SparkQuestionDefinition[] = [
  // 1. Cute & Flirty 💕
  { question: "What was the very first thing you liked about me?", category: "Cute & Flirty" },
  { question: "What is my cutest little habit?", category: "Cute & Flirty" },
  { question: "What outfit of mine is your favorite?", category: "Cute & Flirty" },
  { question: "What's the best thing about my smile?", category: "Cute & Flirty" },
  { question: "What is something I do that makes you blush?", category: "Cute & Flirty" },
  { question: "Hold hands or lock arms when walking?", category: "Cute & Flirty" },
  { question: "Morning text or late night call?", category: "Cute & Flirty" },
  { question: "What is your favorite nickname for me?", category: "Cute & Flirty" },
  { question: "Rate our first hug from 1 to 10!", category: "Cute & Flirty" },
  { question: "What emoji do I remind you of?", category: "Cute & Flirty" },
  { question: "What color looks best on me?", category: "Cute & Flirty" },
  { question: "What do you do when you miss me?", category: "Cute & Flirty" },
  { question: "Who fell in love first: you or me?", category: "Cute & Flirty" },
  { question: "If you could hug me right now, would you let go?", category: "Cute & Flirty" },
  { question: "What was your very first thought when you saw me?", category: "Cute & Flirty" },
  { question: "What is your favorite compliment from me?", category: "Cute & Flirty" },
  { question: "How do you feel when my text pops up on your phone?", category: "Cute & Flirty" },
  { question: "What is one sweet thing you want to tell me right now?", category: "Cute & Flirty" },

  // 2. This or That ⚖️
  { question: "Cozy movie night at home or going out to a cafe?", category: "This or That" },
  { question: "Pizza or Burgers?", category: "This or That" },
  { question: "Beach vacation or Mountain trip?", category: "This or That" },
  { question: "Sweet food or Spicy food?", category: "This or That" },
  { question: "Morning coffee or Late night ice cream?", category: "This or That" },
  { question: "Long drive with music or cozy walk together?", category: "This or That" },
  { question: "Rainy day cuddle or sunny day date?", category: "This or That" },
  { question: "Street food or fancy restaurant?", category: "This or That" },
  { question: "Chocolates or Flowers?", category: "This or That" },
  { question: "Cook together at home or order food online?", category: "This or That" },
  { question: "Watch a horror movie or a cute comedy?", category: "This or That" },
  { question: "Early morning person or late night owl?", category: "This or That" },
  { question: "Cats or Dogs?", category: "This or That" },
  { question: "Call on phone or text all day?", category: "This or That" },
  { question: "Amusement park rides or quiet picnic in the park?", category: "This or That" },

  // 3. Fun & Silly 🤪
  { question: "Who takes longer to reply to texts?", category: "Fun & Silly" },
  { question: "Who is funnier: you or me?", category: "Fun & Silly" },
  { question: "Who is more dramatic when things go wrong?", category: "Fun & Silly" },
  { question: "Who falls asleep faster during movies?", category: "Fun & Silly" },
  { question: "Who takes longer to decide what to eat?", category: "Fun & Silly" },
  { question: "Who gets angry faster over silly things?", category: "Fun & Silly" },
  { question: "Who is more likely to lose their keys or phone?", category: "Fun & Silly" },
  { question: "What is your silliest fear (lizards, bugs, ghosts)?", category: "Fun & Silly" },
  { question: "What is a funny habit of yours I don't know yet?", category: "Fun & Silly" },
  { question: "Who is more stubborn when we argue playfully?", category: "Fun & Silly" },
  { question: "If we enter a couple dance contest, who fails first?", category: "Fun & Silly" },
  { question: "Who is the better secret keeper?", category: "Fun & Silly" },
  { question: "What song is your guilty pleasure to sing in the shower?", category: "Fun & Silly" },
  { question: "Who spends more money on random things?", category: "Fun & Silly" },
  { question: "If a zombie chases us, which one survives longer?", category: "Fun & Silly" },
  { question: "What is the funniest nickname you ever had?", category: "Fun & Silly" },

  // 4. Food & Mood 🍕
  { question: "What food makes you happy instantly?", category: "Food & Mood" },
  { question: "What is your favorite ice cream flavor?", category: "Food & Mood" },
  { question: "What is your comfort movie when you are feeling down?", category: "Food & Mood" },
  { question: "What is one food you secretly hate?", category: "Food & Mood" },
  { question: "What are you craving to eat right now?", category: "Food & Mood" },
  { question: "What is your go-to late night snack?", category: "Food & Mood" },
  { question: "What is your all-time favorite song right now?", category: "Food & Mood" },
  { question: "What is your favorite drink (tea, coffee, juice, boba)?", category: "Food & Mood" },
  { question: "What is your favorite thing to do to relax after a long day?", category: "Food & Mood" },
  { question: "If you could eat only one dish forever, what is it?", category: "Food & Mood" },
  { question: "What is your favorite dessert in the world?", category: "Food & Mood" },
  { question: "What's the best street food in your city?", category: "Food & Mood" },
  { question: "What cartoon or show did you love as a kid?", category: "Food & Mood" },
  { question: "What music do you listen to when you're happy?", category: "Food & Mood" },

  // 5. Little Moments ✨
  { question: "Where do you want our next date to be?", category: "Little Moments" },
  { question: "What is your favorite memory of us so far?", category: "Little Moments" },
  { question: "What made you want to talk to me in the beginning?", category: "Little Moments" },
  { question: "What is one place you really want to visit with me?", category: "Little Moments" },
  { question: "What's one thing you want to ask me right now?", category: "Little Moments" },
  { question: "What is something cute we should do this weekend?", category: "Little Moments" },
  { question: "What is one little promise we should make to each other?", category: "Little Moments" },
  { question: "What made you laugh really hard recently?", category: "Little Moments" },
  { question: "What is a cute photo you want us to take together?", category: "Little Moments" },
  { question: "What is one sweet habit we should start doing together?", category: "Little Moments" },
  { question: "What is your dream holiday with me?", category: "Little Moments" },
  { question: "What is one small thing I can do to make you smile today?", category: "Little Moments" },
  { question: "What made you like me in the beginning?", category: "Little Moments" },
  { question: "What is your favorite thing about us right now?", category: "Little Moments" },
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

/**
 * Randomly pick a question excluding the current one (used for Swap / Shuffle).
 */
export function getRandomSparkQuestion(excludeQuestion?: string): SparkQuestionDefinition {
  const filtered = excludeQuestion
    ? SPARK_QUESTIONS.filter((q) => q.question !== excludeQuestion)
    : SPARK_QUESTIONS;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
