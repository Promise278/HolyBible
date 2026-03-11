export interface Prayer {
  id: string;
  title: string;
  category: string;
  content: string;
  duration: string;
}

export const ALL_PRAYERS: Prayer[] = [
  {
    id: "1",
    title: "Watchfulness and Prayer",
    category: "End Times",
    content:
      "Lord, help me to stay awake and watchful. As the world changes around me, let my heart be anchored in Your Word. Give me the grace to recognize the signs of the times and the courage to stand firm in my faith.",
    duration: "3 min",
  },
  {
    id: "2",
    title: "Light in the Darkness",
    category: "Current Events",
    content:
      "Father, as news of conflict and uncertainty fills our screens, I pray to be a beacon of Your light. Let Your peace, which surpasses all understanding, guard my heart and mind in Christ Jesus today.",
    duration: "2 min",
  },
  {
    id: "3",
    title: "Ready for His Return",
    category: "Hope",
    content:
      "Jesus, I long for Your appearing. Help me to live today in a way that honors You. May my lamp be full of oil, ready for the moment You return. Keep my eyes fixed on things above.",
    duration: "3 min",
  },
  {
    id: "4",
    title: "Boldness for the Gospel",
    category: "Mission",
    content:
      "Holy Spirit, fill me with boldness. In these final days, open doors for me to share the hope found only in Christ. Use me to bring others into Your kingdom before the day of Your return.",
    duration: "2 min",
  },
  {
    id: "5",
    title: "Strength Amidst Trials",
    category: "Living for Jesus",
    content:
      "Lord, strengthen the global church. For those facing trials for Your name, grant them supernatural endurance. Help me to never shrink back from the Truth, no matter the pressure from the world.",
    duration: "4 min",
  },
  {
    id: "6",
    title: "Wisdom in Complexity",
    category: "Daily Wisdom",
    content:
      "Father, I need Your wisdom to navigate the complexities of modern life. Guide my steps, lead my thoughts, and help me to choose the path of righteousness in every situation.",
    duration: "2 min",
  },
  {
    id: "7",
    title: "Consecrated for Your Glory",
    category: "Holiness",
    content:
      "Lord, sanctify me through and through. In a world of compromise, help me to remain set apart for Your purposes. Let my life be a living sacrifice, holy and acceptable to You.",
    duration: "3 min",
  },
  {
    id: "8",
    title: "Peace in Global Shaking",
    category: "Current Events",
    content:
      "Prince of Peace, we pray for the nations. Amidst the shaking of everything that can be shaken, help Your people to remain unshakable in the Kingdom that cannot be moved.",
    duration: "3 min",
  },
  {
    id: "9",
    title: "Expanding Compassion",
    category: "Living for Jesus",
    content:
      "Jesus, give me Your heart for the lost and the broken. In these times where love waxes cold, let my love for You and for others grow stronger and more practical every day.",
    duration: "2 min",
  },
  {
    id: "10",
    title: "Trusting Your Provision",
    category: "Daily Living",
    content:
      "Lord, I surrender my resources to You. In times of economic uncertainty, help me to trust in Your provision and to be a faithful, generous steward of all I have.",
    duration: "2 min",
  },
  {
    id: "11",
    title: "Discernment of Truth",
    category: "End Times",
    content:
      "Father, protect my mind from the deceptions of this age. Align my thoughts with Your Truth and give me discernment to distinguish between what is of You and what is merely of man.",
    duration: "3 min",
  },
  {
    id: "12",
    title: "Endurance in the Race",
    category: "Persistence",
    content:
      "Lord, grant me the endurance to run this race to the finish line. When I am weary, renew my strength. Help me to finish well and fulfill the task You have assigned to me.",
    duration: "4 min",
  },
  {
    id: "13",
    title: "Integrity in the Workplace",
    category: "Daily Living",
    content:
      "Lord, let Your light shine through my work today. May my integrity and excellence point others to You. Let me work as unto the Lord and not unto men.",
    duration: "2 min",
  },
  {
    id: "14",
    title: "Sanctifying My Speech",
    category: "Holiness",
    content:
      "Father, guide the words of my mouth. May they be seasoned with grace and bring life to those who hear. Help me to avoid gossip and negativity that grieves Your Spirit.",
    duration: "2 min",
  },
  {
    id: "15",
    title: "Preparing for Eternity",
    category: "Hope",
    content:
      "Jesus, remind me that this world is not my home. Help me to invest my time and energy into things of eternal value. Let my life reflect the reality of the coming Kingdom.",
    duration: "3 min",
  },
  {
    id: "16",
    title: "Interceding for Leaders",
    category: "Current Events",
    content:
      "Lord, we lift up those in authority. Grant them wisdom and hearts that seek justice. We pray that we may live peaceful and quiet lives in all godliness and holiness.",
    duration: "2 min",
  },
  {
    id: "17",
    title: "Guarding the Heart",
    category: "Living for Jesus",
    content:
      "Father, above all else, I guard my heart today, for everything I do flows from it. Remove any bitterness or pride, and fill me with Your humility and love.",
    duration: "3 min",
  },
  {
    id: "18",
    title: "Signs of the Times",
    category: "End Times",
    content:
      "Lord, give me spiritual eyes to see what You are doing. Help me not to fear the signs of the end, but to rejoice, for my redemption draws near.",
    duration: "3 min",
  },
  {
    id: "19",
    title: "A Spirit of Gratitude",
    category: "Daily Living",
    content:
      "Lord, teach me to be content in all circumstances. Even when things are difficult, I choose to praise You for Your goodness and Your constant presence in my life.",
    duration: "2 min",
  },
  {
    id: "20",
    title: "Finishing the Great Commission",
    category: "Mission",
    content:
      "Jesus, let the Gospel reach every tribe and tongue. Mobilize Your church to fulfill Your command. I offer myself today to play my part in this great work.",
    duration: "3 min",
  },
];

export async function getDailyPrayers(): Promise<Prayer[]> {
  // Use a seed based on days since a fixed point
  const msInDay = 86400000;
  // Offset to make the selection unique
  const daysSinceAnchor = Math.floor(Date.now() / msInDay);

  // Create a selection of 4 prayers that rotates daily
  // We use a prime-like increment to ensure the sets are very different day-to-day
  const startIndex = (daysSinceAnchor * 4) % ALL_PRAYERS.length;

  const selectedPrayers: Prayer[] = [];
  for (let i = 0; i < 4; i++) {
    const index = (startIndex + i) % ALL_PRAYERS.length;
    selectedPrayers.push(ALL_PRAYERS[index]);
  }

  return selectedPrayers;
}

export function getDailyTheme(): { title: string; focus: string } {
  const themes = [
    { title: "Watchfulness", focus: "Staying alert for the Master's return." },
    { title: "Holiness", focus: "Living a life set apart for God's glory." },
    { title: "Mission", focus: "Sharing the hope of Christ in these times." },
    { title: "Peace", focus: "Finding rest in God amidst global uncertainty." },
    { title: "Wisdom", focus: "Applying God's Truth to modern challenges." },
  ];
  const msInDay = 86400000;
  const daysSinceAnchor = Math.floor(Date.now() / msInDay);
  return themes[daysSinceAnchor % themes.length];
}
