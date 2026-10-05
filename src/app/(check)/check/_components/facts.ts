/**
 * Short facts shown under the progress bar while a site is being checked.
 *
 * Each one is a plain statement with its source named in the sentence, so a
 * visitor can look it up. Nothing here is legal advice, promises a ranking,
 * or says what a site must do. Keep them to two or three short sentences.
 */

export type WaitFact = { topic: string; text: string };

export const WAIT_FACTS: WaitFact[] = [
  {
    topic: "Your visitors",
    text: "About 1 in 4 adults in the US lives with a disability, according to the CDC. Many of them use a website differently than you do.",
  },
  {
    topic: "Google",
    text: "Google looks at the phone version of your site first when it decides where your pages show up. A site that only works well on a computer is at a disadvantage.",
  },
  {
    topic: "Why we test with a keyboard",
    text: "Some people never use a mouse. They move through a site with the Tab key, one link or button at a time. If a menu or a form can't be reached that way, they can't use it.",
  },
  {
    topic: "Google Business Profile",
    text: "A Google Business Profile is free. It is what puts your hours, phone number, photos and reviews on Google Search and Maps.",
  },
  {
    topic: "Speed",
    text: "Google has found that more than half of phone visitors leave a page that takes longer than 3 seconds to load.",
  },
  {
    topic: "Website law",
    text: "The US Department of Justice has said that the Americans with Disabilities Act applies to business websites. Thousands of lawsuits over websites people could not use are filed in the US every year.",
  },
  {
    topic: "Most sites have problems",
    text: "WebAIM tests the top one million home pages every year. In 2025 about 95 out of every 100 had accessibility problems a machine could detect.",
  },
  {
    topic: "Google Business Profile",
    text: "Google says customers are 2.7 times more likely to see a business as reputable when its Business Profile is complete.",
  },
  {
    topic: "From our own site",
    text: "This same check found eight hidden links on our own website that a keyboard user could land on without seeing them. A review by hand had missed them. We fixed them the same week.",
  },
  {
    topic: "Search results",
    text: "The title of a page is usually the headline people see in Google results. A clear title that names what you do and where you do it gives people a reason to click.",
  },
  {
    topic: "Easy to read",
    text: "Text that is too faint against its background is the most common problem WebAIM finds. It shows up on about 8 in 10 home pages, and it makes a page harder for everyone to read in sunlight.",
  },
  {
    topic: "A well known case",
    text: "A blind customer could not order a pizza from the Domino's website or app. In 2019 a federal appeals court ruled that the ADA applied to both, and the Supreme Court declined to take up the case.",
  },
  {
    topic: "Local search",
    text: "Google says the local results it shows are based mainly on three things: how relevant a business is to the search, how close it is, and how well known it is.",
  },
  {
    topic: "Pictures",
    text: "A short written description on each picture is read aloud to people who can't see it. Google reads the same description to understand what the picture shows.",
  },
  {
    topic: "Security",
    text: "Chrome marks a site without https as \"Not secure\" right in the address bar. Visitors notice before they read a word.",
  },
  {
    topic: "Reviews",
    text: "Google says that replying to your reviews shows customers you value them and what they have to say.",
  },
];
