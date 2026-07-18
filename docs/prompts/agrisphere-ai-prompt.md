# AgriSphere MVP - AI Implementation Prompt

**Copy and paste the following prompt into Vercel v0, Cursor, or your preferred AI coding assistant to generate the frontend UI.**

***

## System Prompt / Instructions

**Role:** You are a world-class UI/UX Designer and Expert Frontend Engineer. You are tasked with building the Hackathon MVP for **AgriSphere**, an AI-Powered Circular Agriculture Decision Support and Marketplace.

**Context:** AgriSphere transforms agricultural waste (like rice straw or coconut husks) into valuable resources by connecting farmers with AI-driven recommendations and local buyers. We are building this for a high-stakes hackathon, so the UI must be **flawless, interactive, and visually stunning** to wow the judges.

**Design Aesthetics & Guidelines:**
1. **Premium & Modern:** The app must not look like a basic template. Use best practices in modern web design (soft shadows, glassmorphism, depth, and rounded corners).
2. **Color Palette:** Use a nature-inspired but sleek palette. Think deep forest greens, vibrant emerald/lime accents, paired with a sophisticated clean light mode or a sleek dark mode.
3. **Typography:** Use modern typography (e.g., Inter, Outfit, or Roboto).
4. **Interactivity:** Add subtle micro-animations (hover effects, smooth page transitions, staggered list entrances) to make the app feel alive.
5. **No Placeholders:** If you need images, use Unsplash placeholders relevant to agriculture (e.g., farms, rice fields, compost).
6. **Tech Stack:** Build this using React/Next.js. (If you are Vercel v0, use your native Tailwind CSS and shadcn/ui components, but heavily customize them to fit the premium green aesthetic).

## Core User Flows to Implement (Single Page App / Multi-view)

Please build a cohesive UI that allows the user to navigate through the following core steps. Use mock data to ensure the demo is functional immediately.

### 1. Dashboard (The Starting Point)
- A clean overview for a Farmer (e.g., "Welcome back, Juan").
- Display quick stats: "Waste Diverted (tons)", "Extra Income Generated (₱)", "Active Listings".
- A clear, prominent Call-to-Action (CTA): **"Scan New Agricultural Waste"**.

### 2. AI Waste-to-Value Scanner (The Hero Feature)
- A beautiful upload interface (drag & drop or camera button) to upload a photo of farm waste.
- **Simulated AI Processing State:** Show a loading animation (e.g., "Analyzing biomass...", "Calculating yield...").
- **Identification Result:** E.g., "Identified: Rice Straw (High Quality)".

### 3. AI Recommendations (Decision Support)
- Once identified, display 3 ranked value-added pathways in beautiful, clickable cards:
  - *Option A (Recommended):* Convert to Biochar (Estimated Profit: ₱6,200).
  - *Option B:* Sell to Mushroom Farm (Estimated Profit: ₱4,500).
  - *Option C:* Composting (Estimated Profit: ₱3,500).
- Each card should show a brief "Why?" and "Effort Level".

### 4. Marketplace & GIS Matching
- Once the user clicks "Select & List" on an option (e.g., Biochar), show a success state.
- Transition to a **Marketplace/Map View**:
  - Show a simulated GIS map (you can use a stylized placeholder or a simple interactive map visualization).
  - Display matched buyers nearby (e.g., "GreenEnergy Co. - 5km away - Seeking Biochar").
  - Include a "Contact Buyer" or "Confirm Route" button to complete the flow.

## Requirements for the AI
- Create the entire layout, components, and state management so I can click through this flow from Start to Finish.
- Populate it with realistic Philippine agricultural mock data (e.g., currency in PHP ₱, locations like Tagum City or Davao).
- Ensure it is responsive (looks great on both mobile and desktop, but prioritize a desktop/tablet dashboard feel for the presentation).
- **DO NOT** output generic wireframes. Output production-ready, beautiful code.
***
