import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

puppeteer.use(StealthPlugin());

const username = "imposterx.com.in";
const password = "imposter@15#12";
const cookiesFilePath = "./instagram_cookies.json";

const saveCookies = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto("https://www.instagram.com/accounts/login/", {
    waitUntil: "networkidle2",
  });

  // Perform login
  await page.waitForSelector('input[name="username"]', { visible: true });
  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for 15 seconds after clicking submit
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  // Save cookies
  const cookies = await page.cookies();
  fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies, null, 2));
  console.log("✅ Cookies saved successfully!");

  await browser.close();
};

saveCookies().catch(console.error);