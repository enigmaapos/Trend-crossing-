# Digital Antiquities — OpenSea + Polygon indexed discovery

## Requirements
- Node.js 18 or newer (built-in `fetch` is used).
- An OpenSea API key. Create one through the official OpenSea developer portal: https://docs.opensea.io/docs/api-overview

## Run locally
1. Unzip this folder.
2. Copy `.env.example` to `.env` and insert your OpenSea key.
3. Edit `.env` and replace the placeholder with your OpenSea API key. The included server loads `.env` automatically. Never publish `.env`.
4. Open a terminal in this folder and run `npm start`.
5. Open http://127.0.0.1:8787. Do not open `index.html` directly as a file.

## What it does
- Queries OpenSea's Polygon `get NFTs by contract` endpoint with pagination.
- Keeps results restricted to the exact contract address entered in the UI.
- For each returned token ID, queries OpenSea's indexed mint events and uses the earliest returned timestamp as the candidate mint date.
- Sums returned mint-event quantities only when quantities parse and event pagination is exhausted. Otherwise it explicitly displays `Supply unverified`.
- Keeps the API key on the backend, not in browser HTML.
- Allows a candidate cap of 50, 200, 500, or 1,000 to manage rate limits.

## Critical limits
- OpenSea's API and event index are third-party indexed data, not a guarantee of complete historical chain logs. A returned mint quantity sum is marked as indexed evidence and should be independently checked against Polygon ERC-1155 logs before treating it as definitive.
- The shared OpenSea Polygon ERC-1155 contract may contain a very large number of token IDs. A capped scan is not a complete contract-wide inventory. Pagination, API quotas, and time limits can constrain coverage.
- This first backend uses OpenSea metadata and OpenSea-indexed events for assets on Polygon; it does not yet replay the complete contract history through an independent Polygon archive RPC/indexer. Do not interpret missing events as proof of no mint, and do not interpret a supply of one as investment advice.
- The local auction feature remains a browser-only demo; no real bids or payments occur.

## API routes
- `GET /api/health` — confirms server/key configuration without exposing the key.
- `GET /api/scan?contract=0x...&maxItems=200` — returns NFT records and indexed mint evidence.

Official docs: https://docs.opensea.io/reference/get_nfts_by_contract and https://docs.opensea.io/reference/list_events_by_nft
