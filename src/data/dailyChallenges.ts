export interface DailyChallenge {
  id: string;
  question: string;
  type: "multiple_choice" | "numeric";
  options?: string[];
  correctAnswer: string; // index for MC, value for numeric
  explanation: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
}

const challenges: DailyChallenge[] = [
  {
    id: "dc001",
    question: "If you have a $2,000 account and risk 2% per trade with a stop loss 50 pips away, what is your position size (in units) for a $10/pip instrument?",
    type: "numeric",
    correctAnswer: "800",
    explanation: "Risk amount = $2,000 × 2% = $40. Position size = $40 / ($10/pip × 50 pips) = $40 / $500 per lot = 0.08 lots = 800 units.",
    subject: "Trading",
    difficulty: "medium",
    xpReward: 25,
  },
  {
    id: "dc002",
    question: "What is the probability of rolling a sum of 7 with two fair six-sided dice?",
    type: "multiple_choice",
    options: ["1/6", "1/12", "1/18", "1/36"],
    correctAnswer: "0",
    explanation: "There are 6 combinations that sum to 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). Total outcomes = 36. Probability = 6/36 = 1/6.",
    subject: "Probability",
    difficulty: "easy",
    xpReward: 15,
  },
  {
    id: "dc003",
    question: "Solve for x: 3x + 7 = 22",
    type: "numeric",
    correctAnswer: "5",
    explanation: "3x + 7 = 22 → 3x = 15 → x = 5.",
    subject: "Math",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc004",
    question: "In Python, what does `len([1, 2, 3, 4][1:3])` return?",
    type: "multiple_choice",
    options: ["2", "3", "4", "Error"],
    correctAnswer: "0",
    explanation: "`[1:3]` slices from index 1 to 3 (exclusive), giving [2, 3]. `len([2, 3])` = 2.",
    subject: "CS",
    difficulty: "easy",
    xpReward: 15,
  },
  {
    id: "dc005",
    question: "If you invest $10,000 at 7% annual compound interest, approximately how much will you have after 10 years?",
    type: "multiple_choice",
    options: ["$14,000", "$16,000", "$19,672", "$20,000"],
    correctAnswer: "2",
    explanation: "A = P(1+r)^t = $10,000 × (1.07)^10 ≈ $10,000 × 1.9672 = $19,672.",
    subject: "Finance",
    difficulty: "medium",
    xpReward: 20,
  },
  {
    id: "dc006",
    question: "What is the expected value of a trade with 60% win rate, +$100 profit when you win, and -$50 loss when you lose?",
    type: "numeric",
    correctAnswer: "40",
    explanation: "EV = (0.60 × $100) + (0.40 × -$50) = $60 - $20 = $40.",
    subject: "Trading",
    difficulty: "medium",
    xpReward: 25,
  },
  {
    id: "dc007",
    question: "Simplify: (2^3 × 2^5) / 2^4",
    type: "numeric",
    correctAnswer: "16",
    explanation: "2^3 × 2^5 = 2^8. 2^8 / 2^4 = 2^4 = 16.",
    subject: "Math",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc008",
    question: "Which Python data structure is best for checking if an element exists in O(1) time?",
    type: "multiple_choice",
    options: ["List", "Dictionary (set keys)", "Tuple", "String"],
    correctAnswer: "1",
    explanation: "Sets and dictionary keys use hash tables, giving O(1) average lookup time.",
    subject: "CS",
    difficulty: "medium",
    xpReward: 20,
  },
  {
    id: "dc009",
    question: "A coin is flipped 3 times. What is the probability of getting exactly 2 heads?",
    type: "multiple_choice",
    options: ["3/8", "1/2", "1/4", "1/8"],
    correctAnswer: "0",
    explanation: "There are 3 favorable outcomes: HHT, HTH, THH. Total outcomes = 8. Probability = 3/8.",
    subject: "Probability",
    difficulty: "medium",
    xpReward: 20,
  },
  {
    id: "dc010",
    question: "What is the Kelly Criterion fraction for a bet with 55% win probability and 1:1 payoff?",
    type: "numeric",
    correctAnswer: "10",
    explanation: "Kelly = (bp - q) / b where b=1, p=0.55, q=0.45. Kelly = (0.55 - 0.45) / 1 = 0.10 = 10%.",
    subject: "Trading",
    difficulty: "hard",
    xpReward: 35,
  },
  {
    id: "dc011",
    question: "If f(x) = 2x + 3, what is f(4)?",
    type: "numeric",
    correctAnswer: "11",
    explanation: "f(4) = 2(4) + 3 = 8 + 3 = 11.",
    subject: "Math",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc012",
    question: "What does the `git commit` command do?",
    type: "multiple_choice",
    options: [
      "Uploads files to GitHub",
      "Saves staged changes to local history",
      "Downloads remote changes",
      "Creates a new branch",
    ],
    correctAnswer: "1",
    explanation: "`git commit` saves staged changes to your local repository history.",
    subject: "CS",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc013",
    question: "You have $500 in credit card debt at 24% APR. If you only pay the minimum ($25/month), how many months to pay off (approximately)?",
    type: "multiple_choice",
    options: ["20 months", "24 months", "28 months", "32 months"],
    correctAnswer: "1",
    explanation: "At $25/month on $500 at 24% APR, interest is ~$10/month initially. It takes approximately 24 months to pay off.",
    subject: "Finance",
    difficulty: "medium",
    xpReward: 20,
  },
  {
    id: "dc014",
    question: "What is the standard deviation of [2, 4, 4, 4, 5, 5, 7, 9]? (population)",
    type: "numeric",
    correctAnswer: "2",
    explanation: "Mean = 5. Squared deviations: 9, 1, 1, 1, 0, 0, 4, 16. Sum = 32. Variance = 32/8 = 4. SD = √4 = 2.",
    subject: "Probability",
    difficulty: "hard",
    xpReward: 30,
  },
  {
    id: "dc015",
    question: "In a bull flag pattern, what typically happens after the flag consolidation?",
    type: "multiple_choice",
    options: [
      "Price reverses sharply down",
      "Price continues upward",
      "Price moves sideways forever",
      "Volume always increases",
    ],
    correctAnswer: "1",
    explanation: "A bull flag is a continuation pattern. After the brief consolidation (flag), price typically continues in the prior uptrend direction.",
    subject: "Trading",
    difficulty: "medium",
    xpReward: 20,
  },
  {
    id: "dc016",
    question: "What is 15% of 240?",
    type: "numeric",
    correctAnswer: "36",
    explanation: "15% × 240 = 0.15 × 240 = 36.",
    subject: "Math",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc017",
    question: "Which HTTP method is used to update an existing resource?",
    type: "multiple_choice",
    options: ["GET", "POST", "PUT", "DELETE"],
    correctAnswer: "2",
    explanation: "PUT is used to update/replace an existing resource. POST creates new, GET reads, DELETE removes.",
    subject: "CS",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc018",
    question: "If you save $200/month in an index fund averaging 8% annually, approximately how much will you have in 10 years?",
    type: "multiple_choice",
    options: ["$24,000", "$30,000", "$36,000", "$42,000"],
    correctAnswer: "2",
    explanation: "Future Value of annuity: FV = PMT × [(1+r)^n - 1] / r = $200 × [(1.00667)^120 - 1] / 0.00667 ≈ $36,000.",
    subject: "Finance",
    difficulty: "medium",
    xpReward: 25,
  },
  {
    id: "dc019",
    question: "What is the area of a circle with radius 3? (Use π ≈ 3.14)",
    type: "numeric",
    correctAnswer: "28.26",
    explanation: "A = πr² = 3.14 × 9 = 28.26.",
    subject: "Math",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc020",
    question: "What is the maximum loss on a long call option?",
    type: "multiple_choice",
    options: [
      "Unlimited",
      "The strike price",
      "The premium paid",
      "The underlying price",
    ],
    correctAnswer: "2",
    explanation: "When buying a call option, the maximum loss is limited to the premium you paid for the option.",
    subject: "Trading",
    difficulty: "medium",
    xpReward: 20,
  },
  {
    id: "dc021",
    question: "In Python, what is the output of `list(range(3, 10, 2))`?",
    type: "multiple_choice",
    options: [
      "[3, 5, 7, 9]",
      "[3, 4, 5, 6, 7, 8, 9]",
      "[2, 4, 6, 8]",
      "[3, 6, 9]",
    ],
    correctAnswer: "0",
    explanation: "range(3, 10, 2) starts at 3, steps by 2, stops before 10: 3, 5, 7, 9.",
    subject: "CS",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc022",
    question: "Two events A and B are independent. P(A) = 0.4, P(B) = 0.5. What is P(A and B)?",
    type: "numeric",
    correctAnswer: "0.2",
    explanation: "For independent events: P(A ∩ B) = P(A) × P(B) = 0.4 × 0.5 = 0.2.",
    subject: "Probability",
    difficulty: "easy",
    xpReward: 15,
  },
  {
    id: "dc023",
    question: "What is the Rule of 72 used for?",
    type: "multiple_choice",
    options: [
      "Calculating taxes",
      "Estimating doubling time for investments",
      "Determining credit scores",
      "Setting stop losses",
    ],
    correctAnswer: "1",
    explanation: "The Rule of 72 estimates how long it takes to double your money: 72 / interest rate ≈ years to double.",
    subject: "Finance",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc024",
    question: "If a stock moves from $100 to $125, what is the percentage gain?",
    type: "numeric",
    correctAnswer: "25",
    explanation: "($125 - $100) / $100 × 100 = 25%.",
    subject: "Trading",
    difficulty: "easy",
    xpReward: 10,
  },
  {
    id: "dc025",
    question: "What is the derivative of x²?",
    type: "multiple_choice",
    options: ["x", "2x", "x²", "2"],
    correctAnswer: "1",
    explanation: "Using the power rule: d/dx(x^n) = n×x^(n-1). So d/dx(x²) = 2x.",
    subject: "Math",
    difficulty: "medium",
    xpReward: 20,
  },
  {
    id: "dc026",
    question: "In SQL, which clause filters rows before grouping?",
    type: "multiple_choice",
    options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
    correctAnswer: "0",
    explanation: "WHERE filters rows before aggregation. HAVING filters after GROUP BY.",
    subject: "CS",
    difficulty: "medium",
    xpReward: 20,
  },
  {
    id: "dc027",
    question: "A trading strategy wins 40% of the time with avg win $150 and avg loss $75. What is the expectancy per trade?",
    type: "numeric",
    correctAnswer: "15",
    explanation: "Expectancy = (Win% × AvgWin) - (Loss% × AvgLoss) = (0.40 × $150) - (0.60 × $75) = $60 - $45 = $15.",
    subject: "Trading",
    difficulty: "medium",
    xpReward: 30,
  },
  {
    id: "dc028",
    question: "What does a p-value of 0.03 mean in hypothesis testing?",
    type: "multiple_choice",
    options: [
      "99.7% confidence the result is true",
      "3% probability of observing this result if the null hypothesis is true",
      "The effect size is 0.03",
      "The sample size is too small",
    ],
    correctAnswer: "1",
    explanation: "A p-value of 0.03 means there's a 3% chance of seeing the observed result (or more extreme) if the null hypothesis were true.",
    subject: "Probability",
    difficulty: "medium",
    xpReward: 25,
  },
  {
    id: "dc029",
    question: "What is the primary advantage of a Roth IRA over a Traditional IRA?",
    type: "multiple_choice",
    options: [
      "Immediate tax deduction",
      "Tax-free growth and withdrawals in retirement",
      "Higher contribution limits",
      "No income limits",
    ],
    correctAnswer: "1",
    explanation: "Roth IRAs are funded with after-tax dollars, so qualified withdrawals in retirement are tax-free.",
    subject: "Finance",
    difficulty: "medium",
    xpReward: 15,
  },
  {
    id: "dc030",
    question: "Solve: log₂(32) = ?",
    type: "numeric",
    correctAnswer: "5",
    explanation: "2^5 = 32, so log₂(32) = 5.",
    subject: "Math",
    difficulty: "medium",
    xpReward: 15,
  },
];

function getDaySeed(): number {
  const today = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getChallengeCategories(): string[] {
  return [...new Set(challenges.map((c) => c.subject))].sort();
}

export function getDailyChallenge(category: string = "All"): DailyChallenge {
  const pool =
    category === "All" ? challenges : challenges.filter((c) => c.subject === category);
  const list = pool.length > 0 ? pool : challenges;
  const seed = getDaySeed();
  return list[seed % list.length];
}

export function getChallengeForDate(dateStr: string): DailyChallenge {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const idx = hash % challenges.length;
  return challenges[idx];
}
