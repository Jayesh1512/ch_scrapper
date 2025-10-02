import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import fs from "fs";
import { log, profile } from "console";

// Dynamic imports for browser dependencies
let puppeteer;
let chromium;

// Determine if we're in local development or production
// Check for Vercel environment variables
const isLocal = !process.env.VERCEL && !process.env.VERCEL_ENV && process.env.NODE_ENV !== 'production';

const app = express();
const PORT = process.env.PORT || 6000;
const username = "imposterx.com.in";
const password = "imposter@15#12";
const cookiesFilePath = "./instagram_cookies.json";

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

const scrapeInstagram = async (profileUrl) => {
  // Initialize browser dependencies based on environment
  if (isLocal) {
    // Use regular puppeteer for local development
    if (!puppeteer) {
      const puppeteerModule = await import('puppeteer');
      puppeteer = puppeteerModule.default;
    }
  } else {
    // Use puppeteer-core + chromium for production/Vercel
    if (!puppeteer) {
      const puppeteerModule = await import('puppeteer-core');
      puppeteer = puppeteerModule.default;
    }
    if (!chromium) {
      const chromiumModule = await import('@sparticuz/chromium');
      chromium = chromiumModule.default;
    }
  }
  
  // Configure browser based on environment
  const browserConfig = isLocal 
    ? { headless: true }
    : {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      };
  
  const browser = await puppeteer.launch(browserConfig);
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Load cookies if available (skip in serverless environment)
  try {
    if (fs.existsSync && fs.existsSync(cookiesFilePath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiesFilePath, "utf8"));
      await page.setCookie(...cookies);
    }
  } catch (error) {
    console.log("Cookie loading skipped in serverless environment");
  }

  await page.goto("https://www.instagram.com/accounts/login/", {
    waitUntil: "networkidle2",
  });

  // Perform login if not already logged in
  if (page.url() !== "https://www.instagram.com/") {
    await page.waitForSelector('input[name="username"]', { visible: true });
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Save cookies for future sessions (skip in serverless environment)
    try {
      if (fs.writeFileSync) {
        const cookies = await page.cookies();
        fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies, null, 2));
      }
    } catch (error) {
      console.log("Cookie saving skipped in serverless environment");
    }
  }
  let hasProfilePicture = false;
  let privateAcc = false;
  
  // Navigate to the Instagram profile
  await page.goto(profileUrl, { waitUntil: "networkidle2" });
  await page.waitForSelector("body");

  // Check if account is private by looking for private account indicators
  try {
    await page.waitForSelector("._aagu", { visible: true, timeout: 3000 });
    privateAcc = false;
  } catch (error) {
    console.log("Account is private or profile image not found");
    privateAcc = true;
  }

  // Extract page content
  const htmlContent = await page.content();
  
  // Save HTML content (skip in serverless environment)
  try {
    if (fs.writeFileSync) {
      fs.writeFileSync("instagram.html", htmlContent);
    }
  } catch (error) {
    console.log("HTML saving skipped in serverless environment");
  }
  
  const $ = cheerio.load(htmlContent);
  const likesArray = [];
  $("li.x972fbf").each((index, element) => {
    const text = $(element).text().trim();
    likesArray.push(text);
  });

  const likes = likesArray[0];
  const comments = likesArray[1];

  const stats = $("header").find("span.x5n08af");

  const descElement = $("header").find("span._ap3a");
  const desc = descElement.length ? descElement.text().trim() : "";

  // Select the profile picture element
  const profilePicElement = $("img[alt*='profile picture']").attr("src");
  console.log(profilePicElement);

  const username = profileUrl.split("instagram.com/")[1].split("/")[0];

  // Count numeric characters in username
  const numericCount = (username.match(/\d/g) || []).length;

  // Calculate nplu (numeric character count / username length)
  const nplu = numericCount / username.length;

  console.log("Username:", username);
  console.log("NPLU:", nplu);

  // Determine if the user has a profile picture (simplified check)
  hasProfilePicture = profilePicElement && profilePicElement.includes('scontent');

  if (stats.length >= 3) {
    const posts = $(stats[0]).text();
    const followers = $(stats[1]).text();
    const following = $(stats[2]).text();
    console.log({ posts, followers, following });
    await browser.close();
    return {
      posts,
      followers,
      following,
      likes,
      comments,
      privateAcc,
      desc,
    };
  }
};

// ROUTE : /api
app.get("/api", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Hi!, welcome to puppeteer",
  });
});

// POST endpoint to scrape Instagram profile
app.post("/scrape", async (req, res) => {
  const { profile } = req.body; // Accept profile URL from request body
  if (!profile) {
    return res.status(400).json({ error: "Profile URL is required" });
  }

  try {
    const data = await scrapeInstagram(profile);
    res.json(data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to scrape profile", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
