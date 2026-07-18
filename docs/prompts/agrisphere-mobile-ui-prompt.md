# AgriSphere Hackathon - AI UI Implementation Prompt

**Copy and paste the following prompt into Vercel v0, Cursor, or your preferred AI coding assistant.**

***

## System Prompt & Role
**Role:** You are a world-class Mobile UI/UX Designer and Expert Frontend Engineer.
**Goal:** Build the frontend for **AgriSphere**, an AI-powered agricultural application designed for a hackathon. The app provides climate-based crop recommendations ("Best to Plant") and AI-driven plant identification/risk assessment ("Worth the Risk?").

## Visual Identity & Aesthetics (Strict Requirements)
The design **MUST** match a premium, modern, iOS-style mobile application.
- **Theme:** Nature-inspired, clean, and highly polished.
- **Background:** Use a rich, deep forest green gradient background (e.g., `bg-gradient-to-br from-green-700 to-green-900`).
- **Cards & Containers:** Use stark white (`bg-white`), heavily rounded corners (`rounded-3xl` or `rounded-[32px]`), and soft, diffuse drop shadows for a floating effect.
- **Typography:** Modern, clean sans-serif (Inter, SF Pro, or Outfit). Use dark gray/black for text inside cards, and white text on the green background.
- **Components:** Include a floating pill-shaped bottom navigation bar. Buttons should be pill-shaped with a solid dark green background and white text. Use high-quality icons (Lucide/Heroicons) and beautiful weather widgets.

## Core Mobile Views to Implement
Please build a cohesive, interactive prototype (Single Page App format) containing the following 4 screens. Make it clickable so I can navigate between them.

### 1. Dashboard (Home Screen)
- **Top Section:** A beautiful weather widget showing current temperature in Tagum City/Davao, humidity, and a brief note (e.g., "Today is a good day to apply fertilizers").
- **Main Actions:** Two prominent, large touch-friendly cards side-by-side:
  1. **"Best to Plant"** (Icon: Sprout/Calendar) - For general crop recommendations based on climate.
  2. **"Worth the risk?"** (Icon: Camera/Scan) - For specific plant scanning and risk assessment.
- **Bottom Navigation:** Floating bar with Home, Dashboard, and Profile icons.

### 2. "Best to Plant" View (General Recommendations)
*Triggers when clicking "Best to Plant". Simulates the LLM analyzing Open-Meteo historical/forecast temperature data.*
- **Header:** "Suggested Crops for Tagum City".
- **List View:** A sleek, vertically scrolling list of crops recommended by the AI based on seasonal temperature projections and supply/demand logic.
- **List Items:** Include crops like: *Mango (Manga), Squash (Kalabasa), Coconut, Banana (Saging), Sayote*.
- **Card Details:** Each crop card should display the Crop Name, an image thumbnail, "Best Month to Plant", and a quick badge for "High Demand" or "Low Supply" (simulating Bantay Presyo web scraping).
- Clicking a crop goes to the **Confirmation/Details View**.

### 3. "Worth the Risk?" View (Specific Plant Scanner)
*Triggers when clicking "Worth the risk?". Simulates PlantNet API / Vision LLM.*
- **Interface:** A camera viewfinder UI overlay. Include a frame where a plant (with roots) is centered.
- **Actions:** "Upload Image" or "Capture" buttons.
- **Processing State:** When "captured", show a slick scanning animation ("Identifying crop and analyzing harvest risks...").
- **Result:** Identifies the plant and immediately shows handling/harvest instructions and the market risk (based on current temperature trends and market supply/demand).

### 4. Details / Confirmation View
*Triggers after scanning a plant or selecting a crop from the "Best to Plant" list.*
- **Hero Image:** A beautiful, large image of the crop with a glassmorphic back button over it.
- **Data Sections (Mocking the API Logic):**
  - **Climate Match:** A small chart or text indicating how the 3-year historical temperature and 9-month forecast aligns with this crop.
  - **Market Supply & Demand:** Analysis on whether it's worth planting right now based on market prices.
  - **Marketing/Action:** A button to "Generate Marketing Copy" or "Add to Farm Plan".

## Technical Constraints
- Build this using **React/Next.js** and **Tailwind CSS**.
- If using Vercel v0, utilize `lucide-react` for icons and standard `shadcn/ui` components but override their styles to match the heavily rounded, premium green/white aesthetic requested above.
- The UI should be responsive but explicitly **constrained to a mobile-app dimension** (e.g., max-width: 400px, centered on desktop screens with a subtle border to simulate a phone frame).
- Include rich mock data so the app feels alive and ready for a pitch immediately. Do not leave empty placeholders.
***
