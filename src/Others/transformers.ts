import { env, AutoTokenizer, AutoModel, AutoProcessor, CLIPVisionModelWithProjection, RawImage, cos_sim, Tensor, pipeline } from '@huggingface/transformers';

env.cacheDir = './.cache';  // Set the cache directory for the transformers library

async function cosineSimilarity(vecA: Tensor, vecB: Tensor): Promise<number> {
    return cos_sim(vecA.data as number[], vecB.data as number[]);
}

// Function to preprocess an image for CLIP
async function preprocessImage(imageBuffer: Buffer) {
    const blob = new Blob([imageBuffer]);
    return RawImage.fromBlob(blob);
}

export async function getSimilarityScoreFrom2Locator(locator1: string, locator2: string): Promise<number> {
    console.log("comparing two locators:");
    console.log("locator1:", locator1);
    console.log("locator2:", locator2);

    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L12-v2', { dtype: 'fp16' });

    const text_embeds1 = await extractor(locator1, { pooling: 'mean', normalize: true });
    const text_embeds2 = await extractor(locator2, { pooling: 'mean', normalize: true });

    // Compute cosine similarity between the two text embeddings
    return await cosineSimilarity(text_embeds1, text_embeds2);
}
