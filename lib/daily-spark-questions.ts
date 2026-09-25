export interface SparkQuestionDefinition {
  question: string;
  category: "Cute & Flirty" | "This or That" | "Fun & Silly" | "Food & Mood" | "Little Moments";
}

export const SPARK_QUESTIONS: SparkQuestionDefinition[] = [
  // ==========================================
  // 1. CUTE & FLIRTY 💕 (Simple, sweet, butterflies)
  // ==========================================
  { question: "What was the exact moment you realized you liked me?", category: "Cute & Flirty" },
  { question: "What outfit of mine makes your jaw drop?", category: "Cute & Flirty" },
  { question: "What is my cutest little habit that I don't notice?", category: "Cute & Flirty" },
  { question: "Forehead kisses, cheek kisses, or hand kisses?", category: "Cute & Flirty" },
  { question: "What is your favorite nickname for me?", category: "Cute & Flirty" },
  { question: "If we had 1 hour alone right now, what would we do?", category: "Cute & Flirty" },
  { question: "What is something I do that makes your heart race?", category: "Cute & Flirty" },
  { question: "What's the best thing about my smile?", category: "Cute & Flirty" },
  { question: "What color looks best on me?", category: "Cute & Flirty" },
  { question: "Who fell for the other person first: you or me?", category: "Cute & Flirty" },
  { question: "If you could hug me right now, for how long?", category: "Cute & Flirty" },
  { question: "What is your favorite compliment you ever got from me?", category: "Cute & Flirty" },
  { question: "What was your very first thought when you saw my face?", category: "Cute & Flirty" },
  { question: "What perfume or scent on me do you like most?", category: "Cute & Flirty" },
  { question: "What emoji best describes how you feel about me today?", category: "Cute & Flirty" },
  { question: "What is one sweet thing you want to whisper to me right now?", category: "Cute & Flirty" },
  { question: "What is your lock screen wallpaper right now?", category: "Cute & Flirty" },
  { question: "How do you feel when my name pops up on your phone?", category: "Cute & Flirty" },
  { question: "What's the sweetest dream you ever had about me?", category: "Cute & Flirty" },
  { question: "Big spoon or little spoon?", category: "Cute & Flirty" },
  { question: "Rate our best hug from 1 to 10!", category: "Cute & Flirty" },
  { question: "What is one secret thought you had about me when we first met?", category: "Cute & Flirty" },
  { question: "If you could freeze time with me for 24 hours, where are we going?", category: "Cute & Flirty" },
  { question: "What's one thing you never get tired of hearing me say?", category: "Cute & Flirty" },
  { question: "What's one little thing I did recently that made your heart melt?", category: "Cute & Flirty" },
  { question: "What's one cute nickname you secretly want to call me?", category: "Cute & Flirty" },
  { question: "What's the cutest face or expression I make?", category: "Cute & Flirty" },
  { question: "If you could hold my hand right now, where would we walk?", category: "Cute & Flirty" },
  { question: "What's your absolute favorite physical feature of mine?", category: "Cute & Flirty" },
  { question: "Do you get butterflies when we make eye contact?", category: "Cute & Flirty" },
  { question: "What's the sweetest text I ever sent you?", category: "Cute & Flirty" },
  { question: "If I was feeling down right now, how would you cheer me up?", category: "Cute & Flirty" },
  { question: "What song instantly reminds you of me?", category: "Cute & Flirty" },
  { question: "Truth: Did you ever stalk my profile before we started dating?", category: "Cute & Flirty" },

  // ==========================================
  // 2. THIS OR THAT ⚡ (Instant playful debates)
  // ==========================================
  { question: "Late night deep talks or sleepy morning cuddles?", category: "This or That" },
  { question: "Cozy movie night under a blanket or going out to a cafe?", category: "This or That" },
  { question: "Pizza or Burgers on our next cheat day?", category: "This or That" },
  { question: "Beach vacation or Snowy mountain cabin?", category: "This or That" },
  { question: "Long drive with loud music or quiet sunset walk?", category: "This or That" },
  { question: "Rainy day tea & snacks or sunny day ice cream date?", category: "This or That" },
  { question: "Street food crawl or aesthetic fancy dinner?", category: "This or That" },
  { question: "Unexpected flowers or your favorite food delivered?", category: "This or That" },
  { question: "Cook together at home or order food online in bed?", category: "This or That" },
  { question: "Watch a scary horror movie or a cute comedy together?", category: "This or That" },
  { question: "Early morning sunrise walk or 2 AM stargazing?", category: "This or That" },
  { question: "Cats or Dogs?", category: "This or That" },
  { question: "Call on phone for hours or text silly memes all day?", category: "This or That" },
  { question: "Amusement park rollercoasters or quiet botanical garden?", category: "This or That" },
  { question: "Hold hands in public or wrap arms around each other?", category: "This or That" },
  { question: "Steal my fries or let me have the very last bite?", category: "This or That" },
  { question: "Sweet dessert or extra spicy savory snack?", category: "This or That" },
  { question: "Matching couple outfits or subtle color coordination?", category: "This or That" },
  { question: "Window seat or aisle seat when traveling together?", category: "This or That" },
  { question: "Morning coffee together or late night boba run?", category: "This or That" },
  { question: "Truth: Would you rather never have wifi or never have sweets?", category: "This or That" },
  { question: "Camping in a tent or staying in a luxury resort?", category: "This or That" },
  { question: "Board games & cards night or video games together?", category: "This or That" },
  { question: "Road trip by car or flying to an island?", category: "This or That" },
  { question: "Spontaneous surprise date or carefully planned itinerary?", category: "This or That" },
  { question: "Sweet chocolates or fresh bakery pastry?", category: "This or That" },
  { question: "Who looks better in black: you or me?", category: "This or That" },
  { question: "Pajamas all day on Sunday or dress up and explore?", category: "This or That" },
  { question: "Sunset boat ride or rooftop dinner overlooking the city?", category: "This or That" },
  { question: "Who gives better backrubs: you or me?", category: "This or That" },

  // ==========================================
  // 3. FUN & SILLY 🤣 (Couples laughing together)
  // ==========================================
  { question: "Who is more dramatic when they get a tiny cold or papercut?", category: "Fun & Silly" },
  { question: "Who takes longer to reply to texts?", category: "Fun & Silly" },
  { question: "Who takes longer to decide what to eat?", category: "Fun & Silly" },
  { question: "Who falls asleep first during movies?", category: "Fun & Silly" },
  { question: "Who is more likely to lose their phone or keys?", category: "Fun & Silly" },
  { question: "What is your silliest fear (bugs, lizards, dark, ghosts)?", category: "Fun & Silly" },
  { question: "Who is funnier: you or me?", category: "Fun & Silly" },
  { question: "Who gets grumpy faster when hungry (hangry)?", category: "Fun & Silly" },
  { question: "Who is more stubborn during playful arguments?", category: "Fun & Silly" },
  { question: "If a zombie apocalypse happens, which of us survives longer?", category: "Fun & Silly" },
  { question: "What song is your guilty pleasure to sing in the shower?", category: "Fun & Silly" },
  { question: "Who spends more money on random things online?", category: "Fun & Silly" },
  { question: "If we enter a couple dance contest, who trips first?", category: "Fun & Silly" },
  { question: "Who is more addicted to scrolling reels / TikTok?", category: "Fun & Silly" },
  { question: "If we swap bodies for 24 hours, what's the first thing you do?", category: "Fun & Silly" },
  { question: "Who is the boss of our relationship?", category: "Fun & Silly" },
  { question: "What is the funniest nickname you ever had as a kid?", category: "Fun & Silly" },
  { question: "Who would win in a tickle fight?", category: "Fun & Silly" },
  { question: "Who snores or talks more in their sleep?", category: "Fun & Silly" },
  { question: "Who is more likely to accidentally burn dinner?", category: "Fun & Silly" },
  { question: "Who takes longer to get ready before going out?", category: "Fun & Silly" },
  { question: "Who says 'sorry' first when we have a mini disagreement?", category: "Fun & Silly" },
  { question: "Who is more likely to get lost even with Google Maps open?", category: "Fun & Silly" },
  { question: "If we got matching silly mini tattoos, what design would we get?", category: "Fun & Silly" },
  { question: "Who is more likely to eat the last slice of cake without asking?", category: "Fun & Silly" },
  { question: "What's the funniest voice or impression I do?", category: "Fun & Silly" },
  { question: "Who is more likely to cry watching an emotional movie?", category: "Fun & Silly" },
  { question: "What's one silly inside joke only the two of us understand?", category: "Fun & Silly" },
  { question: "Who has colder hands when we hold hands?", category: "Fun & Silly" },
  { question: "Who is more spoiled in this relationship?", category: "Fun & Silly" },
  { question: "If you could steal one item from my closet forever, what is it?", category: "Fun & Silly" },
  { question: "Who is more likely to wake up in a silly grumpy mood?", category: "Fun & Silly" },

  // ==========================================
  // 4. FOOD & MOOD 🍕 (Yum, cozy, cravings)
  // ==========================================
  { question: "What food makes you happy instantly when you're sad?", category: "Food & Mood" },
  { question: "What is your favorite ice cream flavor in the world?", category: "Food & Mood" },
  { question: "What are you craving to eat right this second?", category: "Food & Mood" },
  { question: "What is your go-to late night snack at midnight?", category: "Food & Mood" },
  { question: "What is one food you secretly hate that most people love?", category: "Food & Mood" },
  { question: "If you could eat only one dish forever, what is it?", category: "Food & Mood" },
  { question: "What is your comfort movie when you want to relax?", category: "Food & Mood" },
  { question: "What is your favorite drink (tea, coffee, juice, boba, soda)?", category: "Food & Mood" },
  { question: "What's the best street food in your city?", category: "Food & Mood" },
  { question: "What is your dream breakfast in bed?", category: "Food & Mood" },
  { question: "If we could have an unlimited lifetime supply of one snack, what is it?", category: "Food & Mood" },
  { question: "What dessert reminds you of me: sweet, spicy, or cheesy?", category: "Food & Mood" },
  { question: "If you could plan our perfect dinner tonight, what's on the menu?", category: "Food & Mood" },
  { question: "What is your favorite restaurant we've visited together?", category: "Food & Mood" },
  { question: "What's your favorite thing to do on a rainy Sunday afternoon?", category: "Food & Mood" },
  { question: "What cartoon or TV show did you love most as a kid?", category: "Food & Mood" },
  { question: "What music do you listen to when you're in the happiest mood?", category: "Food & Mood" },
  { question: "If we opened a cute little cafe together, what would we name it?", category: "Food & Mood" },
  { question: "What's your ultimate comfort spot when we hang out?", category: "Food & Mood" },
  { question: "If you could request one treat from me right now, what is it?", category: "Food & Mood" },
  { question: "What is your favorite cake flavor for birthdays?", category: "Food & Mood" },
  { question: "What's your favorite season of the year to spend with me?", category: "Food & Mood" },
  { question: "If we made homemade pizza tonight, what toppings are a MUST?", category: "Food & Mood" },
  { question: "What's the best chocolate bar ever made?", category: "Food & Mood" },
  { question: "Hot soup on a cold evening or cold smoothie on a hot day?", category: "Food & Mood" },

  // ==========================================
  // 5. LITTLE MOMENTS ✨ (Memories, dreams, promises)
  // ==========================================
  { question: "Where do you want our very next date to be?", category: "Little Moments" },
  { question: "What is your favorite memory of us together so far?", category: "Little Moments" },
  { question: "What made you want to keep talking to me in the beginning?", category: "Little Moments" },
  { question: "What is one dream country or city you want to visit with me?", category: "Little Moments" },
  { question: "What's one question you've been wanting to ask me all week?", category: "Little Moments" },
  { question: "What is something cute we should plan for this coming weekend?", category: "Little Moments" },
  { question: "What is one little promise we should make to each other today?", category: "Little Moments" },
  { question: "What made you laugh really hard recently?", category: "Little Moments" },
  { question: "What is a cute photo you really want us to take together?", category: "Little Moments" },
  { question: "What is one sweet couple habit we should start doing every day?", category: "Little Moments" },
  { question: "What is your dream road trip with me?", category: "Little Moments" },
  { question: "What is one small thing I can do to make you smile today?", category: "Little Moments" },
  { question: "What is your favorite thing about us right now?", category: "Little Moments" },
  { question: "What's one thing you're most excited for in our future?", category: "Little Moments" },
  { question: "Where is a place where you felt closest to me?", category: "Little Moments" },
  { question: "What's your favorite photo of us saved on your phone?", category: "Little Moments" },
  { question: "If we could adopt any pet together tomorrow, what would it be?", category: "Little Moments" },
  { question: "What's the most thoughtful thing I've done for you?", category: "Little Moments" },
  { question: "What's your favorite memory of us laughing until our stomachs hurt?", category: "Little Moments" },
  { question: "What makes you feel most loved by me?", category: "Little Moments" },
  { question: "If we built our dream home, what's one room it MUST have?", category: "Little Moments" },
  { question: "What's the best surprise I ever gave you?", category: "Little Moments" },
  { question: "What is your favorite time of day to talk to me?", category: "Little Moments" },
  { question: "What's one thing about me that surprised you most after getting to know me?", category: "Little Moments" },
  { question: "What is one little thing you hope never changes about us?", category: "Little Moments" },
  { question: "If you had to describe our bond in 3 words, what are they?", category: "Little Moments" },
  { question: "What's something you're really proud of me for lately?", category: "Little Moments" },
  { question: "What's a song that will always remind you of our sweetest moment?", category: "Little Moments" },
  { question: "What's one place you want us to watch the sunset together?", category: "Little Moments" },
  { question: "What's the best advice or comfort I ever gave you?", category: "Little Moments" },
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
