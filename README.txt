DIGITAL ANTIQUITIES — LIVE OPENSEA LISTINGS

Contents:
- index.html: Digital Antiquities page with a live active-listings gallery.
- api/opensea-listings.js: Vercel serverless function that fetches active listings for the supplied public wallet address.

IMPORTANT SECURITY
1. Do NOT put the OpenSea API key inside index.html or commit it to GitHub.
2. Because the API key was pasted into a chat, rotate/revoke it in OpenSea Developer settings and use a new key.
3. In Vercel, open the project -> Settings -> Environment Variables.
4. Add OPENSEA_API_KEY with the NEW key as its value. Enable it for Production (and Preview if needed), then redeploy.
5. Deploy the folder contents as a Vercel project. The /api/opensea-listings endpoint is required; this is not a standalone-only HTML integration.

The page requests /api/opensea-listings and displays only records whose API status is ACTIVE. It requests up to 50 listings per fetch, uses server-side caching for 60 seconds (with stale-while-revalidate), and does not continuously poll. OpenSea API availability and response fields can vary; verify the gallery after deployment.

Wallet configured: 0x494d8866f098a363e4effdfef2f5e240730b4c2a
Profile link: https://opensea.io/imbl0cks
