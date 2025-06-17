"use server";

function extractAssetId(externalUrl: string): string | null {
  const parts = externalUrl.trim().split("/").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

export async function fetchAssetIdForToken(
  contractId: string,
  tokenId: string
): Promise<{ error: string } | string> {
  const url = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}/getNFTMetadata`;

  const params = new URLSearchParams({
    contractAddress: contractId,
    tokenId: tokenId,
    refreshCache: "false",
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      headers: {
        accept: "application/json",
      },
    });
    if (!response.ok) {
      const errorMessage = "Failed to fetch nft metadata from alchemy";
      console.error(errorMessage, response.status, response.statusText);
      return { error: errorMessage };
    }

    const data = await response.json();

    // Extract external_url from metadata
    if (!data.metadata?.external_url) {
      const errorMessage = "No external_url found in nft metadata from alchemy";
      console.error(errorMessage, data);
      return { error: errorMessage };
    }

    const assetId = extractAssetId(data.metadata.external_url);
    if (!assetId) {
      const errorMessage = "No asset id found in external_url";
      console.error(errorMessage, data);
      return { error: errorMessage };
    }

    return assetId;
  } catch (error) {
    const errorMessage = `Caught error fetching gltf from alchemy ${contractId}/${tokenId}:`;
    console.error(errorMessage, error);
    return { error: errorMessage };
  }
}
