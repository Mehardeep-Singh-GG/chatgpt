/**
 * Mock AI Engine for ChatGPT Stealth Camouflage Layer
 * Generates realistic, authentic, streaming ChatGPT-style responses
 * to common user prompts (coding, advice, writing, jokes, cooking, science, etc.)
 */

export interface MockChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface MockConversation {
  id: string;
  title: string;
  category: 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Previous 30 Days';
  messages: MockChatMessage[];
  updatedAt: number;
}

// Preset realistic ChatGPT conversation history
export const INITIAL_MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'conv-kyoto',
    title: 'Trip to Kyoto planning',
    category: 'Today',
    updatedAt: Date.now() - 1000 * 60 * 45, // 45m ago
    messages: [
      {
        id: 'msg-k1',
        role: 'user',
        content: 'Can you suggest a 4-day itinerary for Kyoto in autumn?',
        createdAt: Date.now() - 1000 * 60 * 50,
      },
      {
        id: 'msg-k2',
        role: 'assistant',
        content: `Here is a curated **4-Day Kyoto Autumn Itinerary** focusing on vibrant fall foliage (*koyo*), historic temples, and authentic local cuisine:

### Day 1: Western Kyoto & Arashiyama
* **Morning**: Stroll through the **Arashiyama Bamboo Grove** early (around 7:30 AM before crowds). Visit **Tenryu-ji Temple** and its UNESCO garden with reflections over the pond.
* **Lunch**: Traditional tofu meal (*yudofu*) near the Togetsukyo Bridge.
* **Afternoon**: Explore the secluded **Otagi Nenbutsu-ji** with its 1,200 whimsical stone statues.
* **Evening**: Riverside walk along the Katsura River with illuminated maple trees.

### Day 2: Central & Northern Kyoto
* **Morning**: Visit **Kinkaku-ji** (The Golden Pavilion) as doors open at 9:00 AM.
* **Midday**: Walk the scenic **Philosopher’s Path** (*Tetsugaku-no-Michi*) connecting Ginkaku-ji to Nanzen-ji.
* **Afternoon**: Discover **Eikan-do Zenrin-ji**, widely considered Kyoto's premier autumn foliage spot.
* **Night**: Explore **Pontocho Alley** for yakitori and local craft sake.

### Day 3: Historic Southern Kyoto & Fushimi
* **Morning**: Hike through the thousands of vermilion torii gates at **Fushimi Inari Shrine**. Reach the Yotsutsuji intersection for panoramic city views.
* **Afternoon**: Head to **Tofuku-ji Temple** to witness the sea of fiery red maples from Tsutenkyo Bridge.
* **Evening**: Traditional tea ceremony experience in **Gion**, followed by dinner.

### Day 4: Day Trip to Uji or Nara
* **Option A (Uji)**: 25 minutes south by JR train. Known as Japan’s green tea capital; visit the 1,000-year-old **Byodoin Temple** (featured on the 10-yen coin).
* **Option B (Nara)**: Feed the friendly deer in Nara Park and marvel at the Great Buddha inside **Todai-ji**.

### Practical Travel Tips:
1. **ICOCA Card**: Use digital Suica or ICOCA on Apple/Google Wallet for seamless train and bus transit.
2. **Footwear**: Expect 15,000–20,000 steps daily; comfortable walking shoes with easy slip-off design are essential for temple entry.
3. **Foliage Peak**: Mid-to-late November offers the richest autumn colors.

Would you like hotel recommendations or specific restaurant reservations for Gion?`,
        createdAt: Date.now() - 1000 * 60 * 48,
      },
    ],
  },
  {
    id: 'conv-nextjs',
    title: 'Next.js performance optimization',
    category: 'Yesterday',
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    messages: [
      {
        id: 'msg-n1',
        role: 'user',
        content: 'How do I optimize large component hydration in Next.js App Router?',
        createdAt: Date.now() - 1000 * 60 * 60 * 27,
      },
      {
        id: 'msg-n2',
        role: 'assistant',
        content: `Optimizing client-side hydration in the **Next.js App Router** is critical for achieving sub-second **Interaction to Next Paint (INP)** and reducing Total Blocking Time (TBT).

Here are the most effective strategies:

### 1. Push Client Boundaries as Deep as Possible
Avoid marking high-level layout or page wrappers with \`'use client'\`. Keep data fetching, static UI, and heavyweight markdown renderers in Server Components.

\`\`\`tsx
// ❌ Anti-pattern: Marking entire page as client
'use client';
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  return <div><HeavyChart /><StaticSidebar /></div>;
}

// ✅ Best Practice: Isolate interactivity to leaves
import { HeavyChartClient } from './HeavyChartClient';
import { StaticSidebar } from './StaticSidebar';

export default function Dashboard() {
  return (
    <div className="flex">
      <StaticSidebar /> {/* Zero JS sent to browser */}
      <HeavyChartClient /> {/* Only interactive code hydrated */}
    </div>
  );
}
\`\`\`

### 2. Lazy Load Below-the-Fold Interactive Components
Use \`next/dynamic\` with selective SSR disabled for components that rely on browser APIs or heavy charting libraries:

\`\`\`tsx
import dynamic from 'next/dynamic';

const DynamicChart = dynamic(() => import('@/components/InteractiveChart'), {
  loading: () => <div className="h-64 animate-pulse bg-zinc-800 rounded-xl" />,
  ssr: false, // Prevents server rendering & hydrates only on client view
});
\`\`\`

### 3. Defer Non-Critical Hydration with Intersection Observer
Wrap expensive widgets in an idle or viewport-triggered wrapper so hydration is delayed until the user scrolls near:

* Use React 19's streaming architecture and \`<Suspense>\` boundaries.
* Split your bundle into independent sub-trees so React can hydrate concurrently without freezing the main thread.

Would you like an example of profiling hydration bottlenecks using the Chrome DevTools Performance panel?`,
        createdAt: Date.now() - 1000 * 60 * 60 * 26,
      },
    ],
  },
  {
    id: 'conv-workout',
    title: 'Daily workout routine & split',
    category: 'Previous 7 Days',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    messages: [
      {
        id: 'msg-w1',
        role: 'user',
        content: 'Can you give me an efficient 4-day workout split for hypertrophy?',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3 - 3000,
      },
      {
        id: 'msg-w2',
        role: 'assistant',
        content: `A **4-Day Upper / Lower Split** is generally considered the gold standard for muscle hypertrophy, balancing stimulus frequency (hitting each muscle group twice weekly) with adequate recovery.

### Weekly Schedule
* **Monday**: Upper Body (A - Strength Focus)
* **Tuesday**: Lower Body (A - Quad Dominant)
* **Wednesday**: Active Recovery / Mobility / Light Zone 2 Cardio
* **Thursday**: Upper Body (B - Hypertrophy & Volume)
* **Friday**: Lower Body (B - Hamstring & Glute Dominant)
* **Weekend**: Rest & Recovery

---

### Upper Body A (Monday)
1. **Barbell Bench Press**: 3 sets × 6–8 reps (2–3 min rest)
2. **Chest-Supported Dumbbell Rows**: 3 sets × 8–10 reps
3. **Overhead Dumbbell Press**: 3 sets × 8–10 reps
4. **Lat Pulldowns (Neutral Grip)**: 3 sets × 10–12 reps
5. **Incline Dumbbell Bicep Curls**: 3 sets × 12 reps
6. **Cable Tricep Pushdowns**: 3 sets × 12–15 reps

### Lower Body A (Tuesday)
1. **Barbell Back Squats or Hack Squats**: 3 sets × 6–8 reps
2. **Romanian Deadlifts (RDLs)**: 3 sets × 8–10 reps
3. **Walking Dumbbell Lunges**: 3 sets × 10 reps per leg
4. **Standing Calf Raises**: 4 sets × 12–15 reps
5. **Hanging Leg Raises**: 3 sets × 12–15 reps

---

### Progressive Overload Rule
Keep a logbook. When you can perform the upper rep limit across all sets with clean form, increase the resistance by 2.5% to 5% next week.

Need me to adjust this for home dumbbells or limited gym equipment?`,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
    ],
  },
  {
    id: 'conv-email',
    title: 'Email draft to property manager',
    category: 'Previous 7 Days',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    messages: [
      {
        id: 'msg-e1',
        role: 'user',
        content: 'Draft a polite but firm email to my apartment manager requesting immediate repair of a leaking bathroom pipe.',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 - 2000,
      },
      {
        id: 'msg-e2',
        role: 'assistant',
        content: `Here is a clear, professional, and firm draft you can send:

---

**Subject:** URGENT Maintenance Request: Active Bathroom Plumbing Leak – Unit [Your Apartment #]

Dear [Property Manager's Name or Management Office],

I hope this message finds you well.

I am writing to urgently report a plumbing issue in **Unit [Your Apartment #]**. There is currently an active leak coming from the pipe under the bathroom sink [or describe location: behind the toilet / ceiling]. 

Water has started pooling on the flooring, and I am concerned that prolonged exposure will cause water damage to the cabinetry, flooring, and potentially affect the unit beneath us. I have placed a bucket and towels underneath as a temporary precaution, but this requires prompt professional inspection and repair.

Please let me know when maintenance will be arriving to inspect and resolve this issue. You have my permission to enter the unit if I am away at work during service hours. I can also be reached directly on my mobile at **[Your Phone Number]**.

Thank you for your prompt assistance in resolving this matter.

Sincerely,  
**[Your Full Name]**  
Unit [Your Apartment #]  
[Your Phone Number]

---

### Tips Before Sending:
* Attach 1–2 photos or a short video showing the leak; this helps the maintenance crew bring the right parts on their first visit.`,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
      },
    ],
  },
  {
    id: 'conv-tailwind',
    title: 'Tailwind CSS v4 overview',
    category: 'Previous 30 Days',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    messages: [
      {
        id: 'msg-t1',
        role: 'user',
        content: 'What are the main changes in Tailwind CSS v4?',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12 - 5000,
      },
      {
        id: 'msg-t2',
        role: 'assistant',
        content: `**Tailwind CSS v4.0** is a major evolutionary release built from the ground up for modern web standards. Here are the defining changes:

### 1. CSS-First Configuration
The legacy \`tailwind.config.js\` file has been replaced with a native CSS approach using the \`@theme\` directive:

\`\`\`css
@import "tailwindcss";

@theme {
  --color-brand-primary: #3b82f6;
  --font-display: "Inter", sans-serif;
  --breakpoint-3xl: 1920px;
}
\`\`\`

### 2. High-Performance Oxide Engine
The compiler is rewritten in **Rust**, delivering build times up to **10x faster** with dramatically smaller memory footprints and instant hot module reloading (HMR).

### 3. Native Cascading & Modern CSS
* Automatic \`@layer\` containment without manual wrapper utilities.
* Full support for CSS container queries, \`color-mix()\`, and modern P3 wide-gamut colors out of the box.
* Simplified zero-config setup in Vite and Next.js Turbopack.`,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
      },
    ],
  },
];

/**
 * Intelligent pattern matcher to craft ultra-realistic, context-aware ChatGPT replies
 */
export function generateMockAiResponse(prompt: string): string {
  const p = prompt.trim().toLowerCase();

  // 1. Coding / Tech / Debugging
  if (
    p.includes('code') ||
    p.includes('python') ||
    p.includes('react') ||
    p.includes('javascript') ||
    p.includes('typescript') ||
    p.includes('function') ||
    p.includes('css') ||
    p.includes('html') ||
    p.includes('api') ||
    p.includes('sql') ||
    p.includes('bug') ||
    p.includes('algorithm')
  ) {
    if (p.includes('python') || p.includes('script') || p.includes('scrape') || p.includes('reverse')) {
      return `Here is a clean, idiomatic Python solution with explanations and error handling:

\`\`\`python
from typing import List, Optional
import time

def process_data(items: List[str], max_retries: int = 3) -> dict:
    """
    Processes a list of data elements with resilient retry logic.
    """
    results = {"success": [], "failed": []}
    
    for item in items:
        cleaned = item.strip().lower()
        if not cleaned:
            continue
            
        success = False
        for attempt in range(1, max_retries + 1):
            try:
                # Simulated processing
                results["success"].append(cleaned)
                success = True
                break
            except Exception as err:
                print(f"[Attempt {attempt}] Failed processing '{cleaned}': {err}")
                time.sleep(0.5 * attempt)
                
        if not success:
            results["failed"].append(cleaned)
            
    return results

# Example usage:
if __name__ == "__main__":
    sample_items = ["  Apple ", "BANANA", "", "Cherry  "]
    output = process_data(sample_items)
    print("Output:", output)
\`\`\`

### Key Features:
1. **Type Annotations**: Clear input and return types using \`typing\`.
2. **Fault Tolerance**: Automatic linear backoff retry mechanism.
3. **Data Sanitization**: Strips excessive whitespace and normalizes casing.

Would you like me to adapt this to an async version or connect it to an external API?`;
    }

    return `Here is a modular, high-performance implementation in **TypeScript / React**:

\`\`\`tsx
import React, { useState, useTransition, useCallback } from 'react';

interface ComponentProps {
  title?: string;
  initialCount?: number;
  onUpdate?: (value: number) => void;
}

export const CounterWidget: React.FC<ComponentProps> = ({
  title = "Metrics Monitor",
  initialCount = 0,
  onUpdate,
}) => {
  const [count, setCount] = useState<number>(initialCount);
  const [isPending, startTransition] = useTransition();

  const handleIncrement = useCallback(() => {
    startTransition(() => {
      setCount((prev) => {
        const next = prev + 1;
        onUpdate?.(next);
        return next;
      });
    });
  }, [onUpdate]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900 p-6 text-white shadow-xl border border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          Live
        </span>
      </div>

      <div className="text-4xl font-bold tracking-tight text-zinc-100">
        {count.toLocaleString()}
      </div>

      <button
        onClick={handleIncrement}
        disabled={isPending}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50"
      >
        {isPending ? 'Updating...' : 'Increment counter'}
      </button>
    </div>
  );
};
\`\`\`

### Architecture Highlights:
* **Concurrent Rendering**: Uses React 19's \`useTransition\` to prevent UI stutters during state mutations.
* **Component Resiliency**: Fully typed props with intelligent fallbacks.
* **Tailwind Ready**: Styled with modern dark theme tokens.

Let me know if you'd like to extend this with persistent local storage or server syncing!`;
  }

  // 2. Greetings / Identity
  if (
    p === 'hi' ||
    p === 'hello' ||
    p === 'hey' ||
    p.startsWith('hello') ||
    p.startsWith('hey there') ||
    p.includes('who are you') ||
    p.includes('what can you do')
  ) {
    return `Hello! I'm ChatGPT, an AI assistant trained by OpenAI. 

I can assist you with a broad spectrum of tasks, including:

* ✍️ **Writing & Editing**: Drafting emails, essays, resumes, and creative stories.
* 💻 **Coding & Debugging**: Writing algorithms, troubleshooting errors, and optimizing architecture across 30+ languages.
* 🧠 **Brainstorming & Strategy**: Developing business ideas, naming concepts, and planning projects.
* 📊 **Analysis & Math**: Breaking down complex topics, summarizing lengthy documents, and step-by-step problem solving.
* 🌍 **Everyday Productivity**: Itineraries, meal plans, workout schedules, and language practice.

What are you working on today?`;
  }

  // 3. Writing / Email / Letters / Essays
  if (
    p.includes('write') ||
    p.includes('email') ||
    p.includes('essay') ||
    p.includes('draft') ||
    p.includes('letter') ||
    p.includes('summarize')
  ) {
    return `Here is a refined, engaging draft tailored to your request:

---

**Subject:** [Topic or Request] – Updates and Proposed Next Steps

Hi [Recipient's Name],

I hope your week is off to a productive start.

I am reaching out regarding **[Project or Discussion Topic]**. Over the past few days, we have been reviewing our current milestones and identified several key opportunities to streamline execution:

1. **Alignment on Core Deliverables**: Ensuring all stakeholders have unified clarity on timeline commitments.
2. **Efficiency Improvements**: Eliminating friction in communication channels to accelerate turnaround times.
3. **Resource Allocation**: Directing primary focus toward the highest-impact objectives first.

I have compiled a quick summary of the findings and would welcome 15 minutes of your time later this week to walk through recommendations. Please let me know what day and time best accommodates your schedule.

Thank you for your time and continued collaboration.

Best regards,  
**[Your Name]**  
[Your Title / Contact Information]

---

### Suggested Adjustments:
* **For a more formal tone**: Replace "Hi" with "Dear" and shorten the bullet points into a single cohesive paragraph.
* **For urgency**: Add a requested response deadline (e.g., *"Please confirm by Thursday at 3:00 PM"*).

Would you like me to adjust the length or focus on a specific industry context?`;
  }

  // 4. Jokes / Humor / Fun
  if (p.includes('joke') || p.includes('funny') || p.includes('laugh') || p.includes('humor')) {
    const jokes = [
      `Why do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛\n\n*(And it saves battery while we ponder why our code works on localhost but fails in production.)*`,
      `There are only 10 types of people in the world:\n\nThose who understand binary, and those who don't. 😄`,
      `A SQL query walks into a bar, walks up to two tables and asks...\n\n*"Can I join you?"* 🍺`,
      `Why was the JavaScript developer sad?\n\nBecause they didn't \`Node\` how to \`Express\` themselves.`,
    ];
    const randomIndex = Math.floor(Math.random() * jokes.length);
    return jokes[randomIndex];
  }

  // 5. Cooking / Recipes / Meals
  if (
    p.includes('cook') ||
    p.includes('recipe') ||
    p.includes('dinner') ||
    p.includes('lunch') ||
    p.includes('food') ||
    p.includes('pasta') ||
    p.includes('breakfast')
  ) {
    return `Here is an authentic, restaurant-quality recipe for **Classic Creamy Garlic & Herb Pasta (Ready in 20 minutes)**:

### ⏱ Prep: 5 mins | Cook: 15 mins | Servings: 2–3

### Ingredients Checklist:
* **Pasta**: 250g (8 oz) Fettuccine, Tagliatelle, or Rigatoni
* **Butter & Olive Oil**: 2 tbsp unsalted butter + 1 tbsp extra virgin olive oil
* **Garlic**: 4–5 cloves, thinly sliced or minced
* **Cream**: 3/4 cup heavy cream (or whole milk + 1 tbsp cream cheese)
* **Parmesan**: 1 cup freshly grated Parmigiano-Reggiano (avoid pre-shredded)
* **Pasta Water**: 1/2 cup reserved starchy cooking water
* **Seasoning**: 1/2 tsp crushed red pepper flakes, sea salt, freshly cracked black pepper, and fresh flat-leaf parsley

---

### Step-by-Step Instructions:

1. **Boil the Pasta**: Bring a large pot of heavily salted water to a rolling boil. Cook pasta until 1 minute shy of *al dente*. **Crucial step**: scoop out 1/2 cup of starchy pasta water before draining!
2. **Sauté Aromatics**: In a wide skillet over medium-low heat, melt butter with olive oil. Add minced garlic and red pepper flakes. Sauté gently for 60–90 seconds until fragrant and golden (do not brown or burn the garlic).
3. **Build the Sauce**: Pour in the heavy cream and bring to a gentle simmer for 2 minutes until slightly reduced.
4. **Emulsify**: Add the hot drained pasta into the skillet. Lower the heat, gradually sprinkle in grated Parmesan while vigorously tossing with tongs. Pour in splashes of reserved pasta water as needed until a silky, glossy coating clings to every noodle.
5. **Garnish & Serve**: Season with cracked black pepper and chopped fresh parsley. Serve immediately in warmed bowls.

### Chef's Pro Tip:
Add pan-seared chicken breast, crispy pancetta, or sautéed wild mushrooms for extra protein!

Enjoy your meal! Would you like a wine pairing suggestion?`;
  }

  // 6. Advice / Life / Decision making
  if (
    p.includes('advice') ||
    p.includes('should i') ||
    p.includes('help me decide') ||
    p.includes('habit') ||
    p.includes('routine') ||
    p.includes('relationship') ||
    p.includes('career')
  ) {
    return `Making decisions like this can feel daunting, but breaking the situation down into structured frameworks often brings immediate clarity:

### 1. Weigh the 10/10/10 Rule
Ask yourself how this choice will impact you:
* **10 minutes from now**: Will it relieve immediate pressure or spark temporary friction?
* **10 months from now**: Will this move you closer to your long-term values and goals?
* **10 years from now**: Will this matter in the grand scheme of your journey?

### 2. Identify Reversible vs. Irreversible Decisions
* **Type 1 (One-way doors)**: High cost to reverse; warrant slow deliberation and risk hedging.
* **Type 2 (Two-way doors)**: Can be altered or corrected quickly; prioritize speed, learning, and gathering empirical feedback.

### 3. Actionable Next Steps:
1. **Define the Worst-Case Scenario**: Write down precisely what happens if the outcome is negative, along with concrete recovery steps. Usually, the fear is worse than the reality.
2. **Run a Mini-Experiment**: Test the water before diving in. Can you trial this commitment for 14 days before making it permanent?
3. **Trust Gut Intuition Backed by Logic**: When choices are evenly matched on paper, choose the option that leaves you with fewer "what-ifs."

What specific factors or trade-offs are weighing most heavily on your mind right now?`;
  }

  // 7. General Fallback (Rich, thoughtful, markdown structured)
  const capitalizedTopic = prompt.length > 30 ? prompt.slice(0, 30) + '...' : prompt;

  return `Here is a comprehensive breakdown on **"${capitalizedTopic}"**:

### Overview
When exploring this topic, it helps to understand both the foundational concepts and how they translate into practical applications.

### Key Considerations:
1. **Core Fundamentals**:
   * Establishing clear baseline principles ensures consistency and avoids common pitfalls down the road.
   * Prioritize quality and depth over superficial coverage.

2. **Practical Implementation**:
   * Start with high-impact, low-friction steps that yield measurable feedback early.
   * Systematically iterate based on what works best in your specific environment.

3. **Long-Term Strategy**:
   * Build automated or repeatable workflows to maintain momentum without unnecessary cognitive overhead.
   * Regularly audit results to ensure alignment with your primary goals.

### Summary
To summarize, focusing on fundamentals, iterating in short cycles, and tracking key indicators will give you the strongest results.

Let me know if you would like to explore any of these specific points in greater detail!`;
}

/**
 * Simulates a realistic token streaming effect identical to OpenAI ChatGPT
 */
export async function streamMockAiResponse(
  prompt: string,
  onChunk: (accumulated: string, delta: string) => void,
  onComplete: () => void,
  signal?: AbortSignal
): Promise<void> {
  const fullText = generateMockAiResponse(prompt);

  // Split response into realistic word/token chunks
  const tokens = fullText.match(/(\s+|\S+)/g) || [fullText];
  let accumulated = '';

  for (let i = 0; i < tokens.length; i++) {
    if (signal?.aborted) {
      break;
    }

    const token = tokens[i];
    accumulated += token;
    onChunk(accumulated, token);

    // Natural human reading jitter:
    // Punctuation causes slight pause, normal words stream rapidly (15-30ms)
    let delay = 18;
    if (token.includes('\n\n')) {
      delay = 65;
    } else if (token.endsWith('.') || token.endsWith('!') || token.endsWith('?')) {
      delay = 45;
    } else if (token.endsWith(',') || token.endsWith(';')) {
      delay = 30;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  onComplete();
}
