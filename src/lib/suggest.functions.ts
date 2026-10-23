import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Item = { id: string; name: string; model: string; category: string; size: string; price: number; stock: number };
type Input = { preference: string; room: string; budget: number; catalog: Item[] };

const schema = z.object({
  summary: z.string(),
  picks: z.array(z.object({ id: z.string(), reason: z.string() })),
});

export const suggestTiles = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    if (!d || typeof d.room !== "string" || !Array.isArray(d.catalog)) throw new Error("Invalid input");
    return { ...d, preference: d.preference.slice(0, 1000), room: d.room.slice(0, 200), catalog: d.catalog.slice(0, 300) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "AI setup missing" };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const catalog = data.catalog.filter((p) => p.stock > 0).map((p) => `${p.id} | ${p.name} | ${p.model} | ${p.category} | ${p.size} | ₹${p.price}/peti | stock ${p.stock}`).join("\n");
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        maxRetries: 0,
        output: Output.object({ schema }),
        system: "You are a tile showroom expert. Recommend up to 4 tiles ONLY from the given catalog (use exact ids). Respect the budget per peti, room suitability (e.g. anti-skid for bathrooms/outdoor). Reply in simple Hinglish.",
        prompt: `Customer preference: ${data.preference}\nRoom: ${data.room}\nBudget per peti (₹): ${data.budget || "not given"}\n\nCatalog:\n${catalog}`,
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false, include: ["reasoning.encrypted_content"] } },
      });
      const out = await result.output;
      const ids = new Set(data.catalog.map((p) => p.id));
      return { ok: true as const, summary: out.summary, picks: out.picks.filter((p) => ids.has(p.id)) };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error("suggestTiles failed", status, e);
      if (status === 402) return { ok: false as const, error: "AI credits khatam ho gaye hain. Credits add karke dobara try karein." };
      if (status === 429) return { ok: false as const, error: "Abhi bahut requests hain, thodi der baad try karein." };
      return { ok: false as const, error: "Suggestion nahi mil paaya, dobara try karein." };
    }
  });
