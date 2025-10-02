# Instagram Scraper for Vercel

This Instagram scraper is optimized for deployment on Vercel using Sparticuz Chromium.

## Features

- ✅ Instagram profile data extraction
- ✅ Serverless deployment ready
- ✅ Sparticuz Chromium for Vercel
- ✅ CORS enabled
- ✅ Error handling
- ✅ Private account detection

## API Endpoints

### GET /api
Health check endpoint
```bash
curl https://your-vercel-app.vercel.app/api
```

### POST /api/scrape
Scrape Instagram profile
```bash
curl -X POST https://your-vercel-app.vercel.app/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"profile": "https://www.instagram.com/instagram/"}'
```

## Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel --prod
```

### 4. Environment Variables (Optional)
Set in Vercel dashboard:
- `NODE_ENV=production`

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```

### 3. Test endpoint
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"profile": "https://www.instagram.com/instagram/"}'
```

## Response Format

```json
{
  "posts": "8,170",
  "followers": "694M",
  "following": "244",
  "likes": "1.2M",
  "comments": "15K",
  "privateAcc": false,
  "desc": "Discover what's new on Instagram 🔎✨",
  "username": "instagram",
  "nplu": 0.125,
  "hasProfilePicture": true
}
```

## Important Notes

1. **Rate Limiting**: Instagram may rate limit requests
2. **Login Credentials**: Update credentials in `/api/scrape.js`
3. **Timeout**: Functions have 30-second timeout limit
4. **Memory**: Optimized for Vercel's memory limits
5. **CORS**: Enabled for cross-origin requests

## Troubleshooting

### Common Issues:
- **Timeout errors**: Reduce page load timeout
- **Memory issues**: Optimize Chromium args
- **Login failures**: Check credentials and 2FA settings

### Vercel Logs:
```bash
vercel logs your-app-name
```

## Security Considerations

- Store credentials in environment variables
- Enable rate limiting if needed
- Monitor usage and costs
- Consider implementing authentication

## Technologies Used

- **Puppeteer Core**: Headless browser automation
- **Sparticuz Chromium**: Serverless Chromium
- **Cheerio**: HTML parsing
- **Vercel**: Serverless deployment platform