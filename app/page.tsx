"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { fetchAssetIdForToken } from "@/lib/metadata";
import { convertGltfToMml } from "@/lib/convert";
import { fetchGltf } from "@/lib/gltf";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { RefreshCw } from "lucide-react";
import { getRandomAsset } from "@/lib/asset";
import assetsData from "@/assets.json";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      primitive: any;
    }
  }
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function Home() {
  const [contract, setContract] = useState(
    "0xdbc52cd5b8eda1a7bcbabb838ca927d23e3673e5"
  );
  const [token, setToken] = useState(
    "24520678957746696926609829029210235920553086833271274856"
  );
  const [assetId, setAssetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gltfUrl, setGltfUrl] = useState<string | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [mmlUrl, setMmlUrl] = useState<string | null>(null);

  // Convert assets data to combobox options
  const avatarOptions: ComboboxOption[] = assetsData.map((asset) => ({
    value: asset.tokenId,
    label: asset.name,
  }));

  useEffect(() => {
    if (assetId) {
      handleFetchGltf(assetId);
    }
  }, [assetId]);

  const handleSubmit = async (contract: string, token: string) => {
    setIsLoading(true);
    setError(null);
    setAssetId(null);
    setGltfUrl(null);
    setGlbUrl(null);
    setMmlUrl(null);

    const result = await fetchAssetIdForToken(contract, token);

    if (typeof result !== "string") {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setAssetId(result);
  };

  const handleFetchGltf = async (assetId: string) => {
    try {
      const gltf = await fetchGltf(assetId);
      if (typeof gltf !== "string") {
        setError(gltf.error);
        setIsLoading(false);
        return;
      }

      setGltfUrl(gltf);
    } catch (err) {
      setError("Failed to fetch GLTF");
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!gltfUrl) return;

    const convert = async () => {
      try {
        const convertResult = await convertGltfToMml(assetId!, gltfUrl);
        if ("error" in convertResult) {
          setError(convertResult.error);
          setIsLoading(false);
          return;
        }

        setGlbUrl(convertResult.glbUrl);
        setMmlUrl(convertResult.mmlUrl);
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      } catch (err) {
        setError("Failed to convert to GLB");
        console.error(err);
        setIsLoading(false);
      }
    };

    convert();
  }, [gltfUrl]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    setAssetId(null);

    const randomAsset = await getRandomAsset();
    setContract(randomAsset.contract);
    setToken(randomAsset.token);

    handleSubmit(randomAsset.contract, randomAsset.token);
  };

  const handleTokenChange = (selectedValue: string) => {
    if (selectedValue) {
      // Check if it's a known token ID from our assets
      const selectedAsset = assetsData.find(
        (asset) => asset.tokenId === selectedValue
      );
      if (selectedAsset) {
        setToken(selectedAsset.tokenId);
        setContract(selectedAsset.contractAddress);
      } else {
        // It's a manually entered token ID
        setToken(selectedValue);
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-[1040px]">
        <div className="text-4xl font-bold mb-8">
          Sandbox to MSquared Converter
        </div>
        <div className="flex flex-col md:flex-row md:gap-4 w-full">
          <div className="mb-8 md:mb-0 flex-1">
            <label
              htmlFor="token-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Avatar Token ID or Name (from contract {contract})
            </label>
            <Combobox
              options={avatarOptions}
              value={token}
              onValueChange={handleTokenChange}
              placeholder="Search by name or enter token ID..."
              className="font-mono"
            />
          </div>

          <div className="mb-8 md:mb-0 md:self-end flex gap-2 justify-end">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              className="cursor-pointer w-fit px-4"
              disabled={isLoading}
            >
              Select Random Avatar
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => handleSubmit(contract, token)}
              className="cursor-pointer"
              disabled={isLoading || !contract || !token}
            >
              {isLoading ? "Loading..." : "Convert"}
            </Button>
          </div>
        </div>

        {error && <div className="mt-4 text-red-500">{error}</div>}

        <div className="flex flex-row gap-4 w-full mt-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Sandbox GLTF
            </label>
            {isLoading && !gltfUrl ? (
              <div className="w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden p-4">
                <div className="h-full flex flex-col gap-4">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="flex-1 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ) : gltfUrl ? (
              <div className="w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                <Canvas camera={{ position: [50, 25, -50], fov: 45 }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} />
                  <Model url={gltfUrl} />
                  <OrbitControls target={[0, 25, 0]} />
                </Canvas>
              </div>
            ) : (
              <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                Original GLTF will appear here
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Converted MSquared GLB
            </label>
            {isLoading && gltfUrl && !glbUrl ? (
              <div className="w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden p-4">
                <div className="h-full flex flex-col gap-4">
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="flex-1 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </div>
              </div>
            ) : glbUrl ? (
              <div className="w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                <Canvas camera={{ position: [-1.7, 1.2, 2.8], fov: 45 }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} />
                  <Model url={glbUrl} />
                  <OrbitControls target={[0, 1.2, 0]} />
                </Canvas>
              </div>
            ) : (
              <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                Converted GLB will appear here
              </div>
            )}
          </div>
        </div>

        {(isLoading && gltfUrl && !mmlUrl) || mmlUrl ? (
          <div className="mt-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MML URL
            </label>
            {isLoading && gltfUrl && !mmlUrl ? (
              <div className="relative flex gap-4 items-center">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[60px]" />
              </div>
            ) : mmlUrl ? (
              <div className="relative flex gap-4 items-center">
                <Input
                  type="text"
                  value={mmlUrl}
                  readOnly
                  className="font-mono"
                  onClick={(e) => {
                    const input = e.target as HTMLInputElement;
                    input.select();
                    navigator.clipboard.writeText(input.value);
                  }}
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(mmlUrl);
                    const button = document.activeElement as HTMLButtonElement;
                    const originalContent = button.innerHTML;
                    button.innerHTML = "✓";
                    button.classList.add("bg-green-500", "hover:bg-green-600");
                    setTimeout(() => {
                      button.innerHTML = originalContent;
                      button.classList.remove(
                        "bg-green-500",
                        "hover:bg-green-600"
                      );
                    }, 2000);
                  }}
                  size="sm"
                  className="whitespace-nowrap w-[60px] cursor-pointer flex-shrink-0"
                >
                  Copy
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
