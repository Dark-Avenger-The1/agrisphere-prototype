# Hackathon Tech Stack & Integration Plan

**Philippine Circular Agriculture App — Scoped for Speed and Feasibility**

> **Strategy Note:** To build a winning MVP in a hackathon, minimize the number of external APIs you have to register and configure. By grouping requirements into a single, robust Large Language Model (LLM) with dynamic prompts, and utilizing free, no-key APIs for the rest, you reduce your integration points from 10 down to just 4 simple engines.

## 1. Temperature of Location (Past 3 Years)

**Tech Solution:** Open-Meteo Historical Weather API (Free, no key required)

**Example / Practical Approach:**
[archive-api.open-meteo.com/v1/archive?latitude=7.45&longitude=125.81&start_date=2023-01-01&end_date=2026-01-01&daily=temperature_2m_max,temperature_2m_min](https://archive-api.open-meteo.com/v1/archive?latitude=7.45&longitude=125.81&start_date=2023-01-01&end_date=2026-01-01&daily=temperature_2m_max,temperature_2m_min)

**Hackathon Rationale:** Enables rapid, free historical queries using standard latitude and longitude coordinates. Perfect for Tagum/Davao location scoping.

## 2. Predict Temperature by Season (Months/Days)

**Tech Solution:** Open-Meteo Seasonal Forecast API (Free, ECMWF model)

**Example / Practical Approach:** No AI needed for patterns. Take 3-year historical data from #1 and run a simple backend groupby-average per month.

**Hackathon Rationale:** Provides projections out to 9 months. Computing seasonal averages directly in your backend is 100% reliable and avoids complex model-training bugs under tight deadlines.

## 3. Crop Investment Recommendation (Data Mining)

**Tech Solution:** General-Purpose LLM (Claude or GPT) via Custom Prompting

**Example / Practical Approach:**
Prompt: *"Given these temperature patterns [data from #1/#2] in Tagum City, which of these crops [list] are most suitable to plant and why?"*

**Hackathon Rationale:** No specialized API exists. Passing your gathered climate data into an LLM provides immediate, highly-explainable crop recommendations to present to judges.

## 4. Supply & Demand of Farm Goods by Season

**Tech Solution:** Web Scraping DA Bantay Presyo & PSA Price Situationer

**Example / Practical Approach:**
URL Reference: [bantaypresyo.da.gov.ph](http://www.bantaypresyo.da.gov.ph/) and [psa.gov.ph/statistics/price-situationer/selected-agri-commodities](https://psa.gov.ph/statistics/price-situationer/selected-agri-commodities)

**Hackathon Rationale:** Create a web scraper (similar to a fuel prices scraper) to extract real-time price changes. Rising prices represent under-supply, while falling prices identify a market over-supply. Use an LLM to generate the final analytical summaries.

## 5. Marketing Copy Generator for Farm Produce

**Tech Solution:** General-Purpose LLM (Claude or GPT) via Custom Prompting

**Example / Practical Approach:**
Prompt: *"Write an engaging, high-converting B2B marketplace listing description for [crop], harvested in [location], emphasizing its organic and local quality."*

**Hackathon Rationale:** Requires zero setup. Simply reuse your primary LLM endpoint with a creative marketing persona to instantly generate polished merchant-focused copy.

## 6. Plant Species & Disease Identification

**Tech Solution:** Pl@ntNet API (Free tier, 79k+ species) OR Plant.id / Kindwise

**Example / Practical Approach:**
Developer Hub: [my.plantnet.org](https://my.plantnet.org/)

**Hackathon Rationale:** Provides rapid image analysis of leaf/plant photos. Alternatively, you can directly pass raw images to a multimodal vision LLM (e.g., GPT-4o or Claude 3.5 Sonnet) to detect visual disease anomalies.

## 7. Crop Growth & Care Instructions

**Tech Solution:** Perenual API (Plant growth database) OR Plantix Vision API

**Example / Practical Approach:**
Developer Hub: [perenual.com/docs/api](https://perenual.com/docs/api)

**Hackathon Rationale:** Provides structured watering, sunlight, soil, and care intervals. For harvest timelines, supplement this by prompting your LLM with the planting date.

## 8. Circular 'Waste-to-Value' Advisor

**Tech Solution:** General-Purpose LLM (Claude or GPT) via Custom Prompting

**Example / Practical Approach:**
Prompt: *"Given a waste output of [waste, e.g., rice husks], suggest 3 practical, low-cost ways to convert this into a high-value resource (fertilizer, biochar, feed) for a farm."*

**Hackathon Rationale:** Perfect candidate for LLM-driven synthesis. Provides smallholders with highly actionable circular economy steps based on their unique crop yields.

## 9. Verified Farmer KYC / National ID Verification

**Tech Solution:** Front-End OCR (Tesseract.js) + Manual Admin-Approval Toggle

**Example / Practical Approach:**
Production Alternatives (Not Hackathon-Friendly due to contracts): eKYC.gov.ph, Sumsub, FACEKI

**Hackathon Rationale:** Commercial KYC platforms require heavy contracts and paid setups. The optimal hackathon approach is running client-side OCR (Tesseract.js) to extract data from an uploaded ID, then letting an admin approve it via a simple backend toggle.

## 10. Social Media & Post Content Moderator

**Tech Solution:** General-Purpose LLM (Claude or GPT) via Custom Prompting

**Example / Practical Approach:**
Prompt: *"Analyze this post text and image. Does this relate to legitimate agricultural trade, crop sharing, or community farming? Respond with YES or NO, followed by a brief reason."*

**Hackathon Rationale:** Instantly filters spam or unrelated posts on your marketplace. Keeps the focus purely on agriculture using a basic classifier prompt on your existing LLM endpoint.

## Hackathon Reuse & Feasibility Matrix

To maximize output under strict time limits, consolidate your resources. Do not build ten different software architectures. Instead, route your features to one of these main integration hubs:

| Requirement Category | Selected Tech / API Tool | Requires New Integration? | Implementation Speed Tip |
|---|---|---|---|
| #1, #2 (Temp & Climate Projections) | Open-Meteo API (Historical & Forecast) | YES — 1 Free Integration | Use simple latitude/longitude coords; no API key needed. |
| #4 (Market Supply & Demand) | Bantay Presyo Scraper (Python/JS) | YES — 1 Web Scraper | Build a lightweight web scraper targeting current price movements. |
| #6 (Plant Identification) | Pl@ntNet API OR Vision LLM | YES — 1 Photo Integration | If already using an LLM, pass plant photos directly to Vision API. |
| #7 (Crop Growth & Care Databases) | Perenual API (Optional) | YES — 1 Data Integration | Only integrate if you want a detailed pre-built plant database. |
| #9 (Farmer ID Verification/KYC) | Tesseract.js + Backend Mock | YES — 1 Local Library | Don't use real KYC. Use client OCR then manual admin approval. |
| #3, #5, #8, #10 (Recommendations, Marketing, Waste-to-Value, Moderation) | Consolidated LLM API (Claude/GPT) | REUSED — 0 New Setup | Deploy a single LLM connection. Change only the system prompt. |
