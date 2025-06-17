import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ImageGeneration() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useAction(api.together.generate);

  const handleGenerate = async () => {
    if (!prompt || loading) return;
    setLoading(true);
    setError(null);
    setImageUrl("");

    try {
      const url = await generate({ prompt });
      setImageUrl(url);
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2>Image Generation</h2>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a prompt"
        disabled={loading}
      />
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </Button>
      <div className="flex flex-col gap-4">
        {error && <p className="text-red-500">{error}</p>}
        {imageUrl && !error && <img src={imageUrl} alt={prompt} width="512" />}
      </div>
    </div>
  );
}
