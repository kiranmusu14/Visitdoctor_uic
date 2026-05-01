# Preventable Visit Detector

Cloudflare Worker app for Prompt 1: scan the live hackathon patient database, rank patients by preventable ED visit risk, draft outreach, and let a coordinator approve, modify, or reject the recommendation.

## Setup

```bash
cd agent
npm install
npx wrangler secret put GROQ_API_KEY
npm run deploy
```

For local dev, copy `.dev.vars.example` to `.dev.vars` and put the Groq key there. Do not commit `.dev.vars`.

The app still works without Groq by using a deterministic outreach draft, but Groq makes the outreach wording more natural.

If you are using Cloudflare Builds from GitHub, set the build root directory to `agent` and the deploy command to `npm run deploy`.
