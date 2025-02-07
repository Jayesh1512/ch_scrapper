import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";
import fs from "fs";
import { log } from "console";

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;
const username = "imposterx.com.in";
const password = "imposter@15#12";
const cookiesFilePath = "./instagram_cookies.json";

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

const scrapeInstagram = async (profileUrl) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1280, height: 800 });

  // Load cookies if available
  if (fs.existsSync(cookiesFilePath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesFilePath, "utf8"));
    await page.setCookie(...cookies);
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

    // Save cookies for future sessions
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies, null, 2));
  }

  // Navigate to the Instagram profile
  await page.goto(profileUrl, { waitUntil: "networkidle2" });
  await page.waitForSelector("body");

  // Wait for the profile image (._aagu) with a maximum wait time of 3 seconds
  const profileImageExists = await page.waitForSelector("._aagu", {
    visible: true,
    timeout: 3000, // Maximum wait time of 3 seconds
  }).catch(() => null);

  // If profile image is not found (i.e., the account is private), skip this part
  if (!profileImageExists) {
    console.log("This account is private or the profile image is unavailable.");
  } else {
    // Hover over the profile image (._aagu) to trigger any popups
    await page.hover("._aagu");
  }

  // Extract page content
  const htmlContent = await page.content();
  fs.writeFileSync("instagram.html", htmlContent);
  const $ = cheerio.load(htmlContent);
  const likesArray = [];
  $("li.x972fbf").each((index, element) => {
    const text = $(element).text().trim();
    likesArray.push(text);
  });

  const likes = likesArray[0];
  const comments = likesArray[1];

  const stats = $("header").find("span.x5n08af");

  if (stats.length >= 3) {
    const posts = $(stats[0]).text();
    const followers = $(stats[1]).text();
    const following = $(stats[2]).text();
    console.log({ posts, followers, following });
    await browser.close();
    return { posts, followers, following, likes, comments };
  }
};

// ROUTE : /api
app.get("/api", (req,res)=> {
  return res.status(200).json({
    success: true,
    message: "Hi!, welcome to puppeteer"
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
