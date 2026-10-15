const WALLET_ADDRESS = '0x494d8866f098a363e4effdfef2f5e240730b4c2a';
const API_BASE = 'https://api.opensea.io/api/v2';

async function openSeaFetch(url, apiKey) {
  const response = await fetch(url, { headers: { accept: 'application/json', 'x-api-key': apiKey } });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OpenSea API returned ${response.status}${body ? `: ${body.slice(0, 180)}` : ''}`);
  }
  return response.json();
}

function findNftRef(listing) {
  const existing = listing.asset || listing.item || listing.nft || {};
  if (existing.contract && (existing.identifier ?? existing.token_id)) {
    return {
      contract: existing.contract,
      identifier: String(existing.identifier ?? existing.token_id),
      chain: listing.chain || existing.chain || 'ethereum'
    };
  }
  const offers = listing.protocol_data?.parameters?.offer || listing.protocolData?.parameters?.offer || [];
  // Seaport itemType 2 = ERC-721, 3 = ERC-1155. Ignore payment-token offers.
  const nftOffer = offers.find(x => ['2', '3', 2, 3].includes(x.itemType) && x.token && x.identifierOrCriteria);
  if (!nftOffer) return null;
  return {
    contract: nftOffer.token,
    identifier: String(nftOffer.identifierOrCriteria),
    chain: listing.chain || 'ethereum'
  };
}

async function enrichListing(listing, apiKey) {
  const ref = findNftRef(listing);
  const oldAsset = listing.asset || listing.item || listing.nft || {};
  if (!ref) return { ...listing, asset: oldAsset };
  const imageAlreadyPresent = oldAsset.image_url || oldAsset.display_image_url || oldAsset.image ||
    oldAsset.image_original_url || oldAsset.metadata?.image;
  if (imageAlreadyPresent && oldAsset.contract && (oldAsset.identifier ?? oldAsset.token_id)) {
    return { ...listing, asset: { ...oldAsset, contract: ref.contract, identifier: ref.identifier } };
  }
  try {
    const chain = encodeURIComponent(String(ref.chain).toLowerCase());
    const contract = encodeURIComponent(ref.contract);
    const identifier = encodeURIComponent(ref.identifier);
    const payload = await openSeaFetch(`${API_BASE}/chain/${chain}/contract/${contract}/nfts/${identifier}`, apiKey);
    const nft = payload.nft || payload;
    const metadata = nft.metadata || {};
    return {
      ...listing,
      asset: {
        ...oldAsset,
        contract: nft.contract || ref.contract,
        identifier: String(nft.identifier ?? ref.identifier),
        name: oldAsset.name || nft.name || metadata.name || `NFT #${ref.identifier}`,
        collection: oldAsset.collection || nft.collection || nft.collection_name || '',
        image_url: oldAsset.image_url || nft.image_url || nft.display_image_url || nft.image_original_url ||
          nft.image || metadata.image || '',
        display_image_url: oldAsset.display_image_url || nft.display_image_url || nft.image_url ||
          nft.image_original_url || nft.image || metadata.image || '',
        image_original_url: oldAsset.image_original_url || nft.image_original_url || nft.image_url || metadata.image || '',
        metadata
      }
    };
  } catch (e) {
    // Keep the listing visible even if one NFT's metadata cannot be fetched.
    return { ...listing, asset: { ...oldAsset, contract: ref.contract, identifier: ref.identifier } };
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENSEA_API_KEY is not configured in Vercel Environment Variables.' });
  try {
    const url = `${API_BASE}/account/${encodeURIComponent(WALLET_ADDRESS)}/listings`;
    const payload = await openSeaFetch(url, apiKey);
    const listings = Array.isArray(payload.listings) ? payload.listings : [];
    const active = listings.filter(item => !item.status || String(item.status).toUpperCase() === 'ACTIVE');
    const enriched = await mapLimit(active, 4, item => enrichListing(item, apiKey));
    return res.status(200).json({ listings: enriched });
  } catch (error) {
    return res.status(502).json({ error: error.message || 'Unable to load OpenSea listings.' });
  }
};
