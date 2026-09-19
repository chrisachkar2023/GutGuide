# GutGuide

## Product

GutGuide is a personalized food guidance application for people living with Crohn's disease.

The core idea is:

> Crohn's is personal, so food guidance should be personal too.

Food tolerance varies substantially between individuals. GutGuide should therefore avoid presenting a universal "safe foods" list. Instead, it helps users learn from their own eating history, symptoms, preferences, and experiences.

## Target Users

People of different ages living with Crohn's disease who want to better understand their relationship with food.

The product should feel approachable and supportive rather than overly clinical.

## Core Features

### 1. Food Search

Users can search for foods and meals.

Show:

* Ingredients
* Nutritional information where available
* Relevant food characteristics
* A personalized compatibility score
* Explanation of why the score was given
* User-specific history with the food when available

The compatibility score should be presented as an estimate based on available information and the user's own history. Do NOT claim that a food will or will not cause a Crohn's flare.

### 2. Food Near You

Help users discover nearby restaurants and food options.

The experience should eventually support personalized recommendations based on:

* User preferences
* Previously tolerated foods
* Previously logged symptoms
* Dietary restrictions

### 3. Homepage

The homepage should quickly communicate:

* What GutGuide does
* The user's recent food/symptom activity
* Useful personalized insights
* Easy actions such as logging a meal, searching for food, or scanning a menu

### 4. Cooking / Recipes

Provide recipes designed around the user's preferences and food history.

ElevenLabs may be used for voice guidance while cooking.

The cooking experience should allow users to follow steps without constantly looking away from the recipe.

### 5. My Progress

Include:

* Overview
* Food insights
* Symptom trends
* Achievement trends
* Foods the user has tolerated well
* Potential triggers
* Symptom graphs over time

  * Pain
  * Bloating
  * Energy
* Meals logged

Use clear visualizations and make trends easy to understand.

### 6. Menu Scanner

Users can scan or upload a restaurant menu.

GutGuide should:

1. Extract menu items
2. Identify ingredients when possible
3. Compare items against the user's preferences and history
4. Present potentially compatible options
5. Explain why each option was suggested

Do not present the result as a medical guarantee.

## Tech Stack

* React
* TypeScript
* Next.js
* Tailwind CSS
* PostgreSQL
* Drizzle ORM
* Vercel for deployment

Prefer the existing project architecture over introducing new frameworks or technologies.

## Development Principles

* Use TypeScript for new code.
* Reuse existing components and utilities.
* Do not create duplicate components when an existing component can be extended.
* Keep components modular and reusable.
* Avoid unnecessary dependencies.
* Do not rewrite working parts of the application without a reason.
* Do not modify unrelated files.
* Prioritize a polished hackathon demo over unnecessary enterprise complexity.
* Mobile responsiveness is important.
* Accessibility matters.
* Keep loading states, error states, and empty states polished.
* Run lint/type checks after substantial changes.

## UI / UX

GutGuide should feel like a polished modern consumer health application.

Prioritize:

* Clean visual hierarchy
* Strong typography
* Consistent spacing
* Intuitive navigation
* Clear calls to action
* Responsive design
* Accessible components
* Useful animations only when they improve the experience

Avoid making the interface look like a generic dashboard template.

## AI

AI should enhance the product rather than exist as a gimmick.

AI features should:

* Explain recommendations
* Personalize food guidance
* Help interpret menus
* Assist with recipes
* Generate useful summaries of user trends

AI output should be transparent about uncertainty.

Never present AI output as a diagnosis, medical treatment, or guaranteed prediction of a Crohn's flare.

## Hackathon Priorities

GutGuide is being developed for a hackathon.

Optimize for:

1. A compelling user experience
2. A clear and memorable problem/solution
3. Personalization
4. Strong visual polish
5. A reliable live demo
6. Meaningful use of the required hackathon technologies

Do not sacrifice demo reliability for unnecessary technical complexity.

## Hackathon Tracks

Current target tracks:

* Seed round
* Xtract
* MLH Best Use of Tiger Data
* MLH Best Use of Gemini API

When implementing features, consider whether they can create a meaningful, demonstrable use of these technologies rather than adding them superficially.

## Coding Workflow

Before implementing a significant feature:

1. Inspect the existing architecture.
2. Identify relevant existing components and services.
3. Explain the proposed approach briefly.
4. Implement the smallest clean solution.
5. Run relevant checks.
6. Fix errors caused by the implementation.
7. Do not modify unrelated functionality.

When asked to implement a feature, prefer modifying the existing architecture over creating a parallel architecture.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
