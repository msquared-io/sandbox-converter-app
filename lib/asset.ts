"use server";

export async function getRandomAsset() {
  const assets = (await import("../assets.json")).default;

  const validAssets = assets.filter((asset) => asset.assetId !== null);

  const randomAsset =
    validAssets[Math.floor(Math.random() * validAssets.length)];

  return {
    contract: randomAsset.contractAddress,
    token: randomAsset.tokenId,
  };
}
