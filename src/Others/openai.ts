import dotenv from "dotenv";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getAndDrawBoxes } from "./inference";
import { BoundingBox } from "../Types/bbox";
import Jimp from "jimp";
import { saveData } from "./file";

const Result = z.object({
    value: z.number(),
});

dotenv.config();

const openai = new OpenAI();
const caption_model = "gpt-4o-2024-08-06";
const locate_model = "gpt-4o-2024-08-06";
const embed_model = "text-embedding-3-large";

const CAPTION_PROPMT = `You are an expert at captioning web element. You are given an image of a web element. \
Generate a single precise locator for the web element based on visual description. \
Visual Description should contains all details available from the web element. \
Example attributes of details include but not limited to text content, background color, shape, icon, etc. \
If the visual description includes an icon, you can describe the icon with its name if you know. Example: icon="hamburger" or icon="youtube". If you don't know the icon name, describe the icon. \
If the element contains an icon, you can assume it is button.

Locator format: <[Element] with description based on visual>. Element can only be button, text, input field, or image. \
For image elements, if you recognize the image, say the name of the image and describe the visual description. \
If you don't recognize the image, describe the visual description. \
Locator example: <button with content="Sign in", background_color="Dark Blue", shape="rectangle">
Locator should be within 100 words.`;

const LOCATE_PROMPT = `You are an expert at locating web element based on visual description. \
You are provided with a screenshot of a web page with the bounding boxes annotating the web elements and the index number of the corresponding bounding box. \
Index number has the same color with the corresponding bounding box border color and are positioned on the TOP LEFT CORNER of the corresponding bounding box. \
You are also provided with a visual description of a web element that you need to identify. \

You should do the following steps to improve your accuracy after receving the image and the description:
1. Go through each bounding box from left to right, top to bottom.
2. For each web element within the bounding box, identify whether they match the visual description. \
For an element to match the visual description, it must contain all the features provided in the visual description. \
For example, if the element locator is <button with content="Sign in", background_color="Dark Blue", shape="rectangle">, the element must have content text "Sign in", background color "Dark Blue", and shape "rectangle".
3. If the web element matches the visual description, provide the index number of the bounding box and stop the process.
4. After going through all the web elements, if no element matches the visual description, answer -1.

Answer format: a single number, which is the index of the bounding box. If no element matches the visual description, answer -1.`;

let similarityValue = 0.8;

export function setSimilarity(sim: number) {
    similarityValue = sim;
    console.log(similarityValue);
}

function cosine_similarity(a: number[], b: number[]) {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;

    for (let i = 0; i < a.length; i++) {
        dotproduct += a[i] * b[i];
        mA += a[i] * a[i];
        mB += b[i] * b[i];
    }

    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    let similarity = dotproduct / (mA * mB);
    return similarity;
}

export async function getSimilarity(locator: string, newLocator: string): Promise<number> {
    const [embeddingObject, newEmbeddingObject] = await Promise.all([
        openai.embeddings.create({
            model: embed_model,
            input: locator.replace("<", "").replace(">", ""),
            encoding_format: "float",
        }),
        openai.embeddings.create({
            model: embed_model,
            input: newLocator.replace("<", "").replace(">", ""),
            encoding_format: "float",
        }),
    ]);

    console.log(locator);
    console.log(newLocator);
    const embedding = embeddingObject.data[0].embedding;
    const newEmbedding = newEmbeddingObject.data[0].embedding;
    const similarity = cosine_similarity(embedding, newEmbedding);

    return similarity;
}

export async function getCaption(base64image: string) {
    const response = await openai.chat.completions.create({
        messages: [
            { role: "system", content: CAPTION_PROPMT },
            {
                role: "user",
                content: [
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/png;base64,${base64image}`,
                            detail: "low",
                        },
                    },
                ],
            },
        ],
        model: caption_model,
        seed: 0,
        max_tokens: 100,
        temperature: 0,
    });

    return response.choices[0].message.content;
}

export async function getReplayTargetBBox(
    imageBuffer: Buffer,
    locator: string,
): Promise<BoundingBox> {
    try {
        console.log("Getting target bounding box");
        const jimp = await Jimp.read(imageBuffer);
        let width = 1248;
        let factor = jimp.getWidth() / width;
        jimp.resize(width, Jimp.AUTO);

        let result = await getAndDrawBoxes(await jimp.getBufferAsync(Jimp.MIME_PNG));
        saveData("./logs/drawnForReplay.png", result.buffer);
        let bbox = await getReplayBoundingBox(result.buffer, result.bboxes, locator);

        if (bbox == null) {
            console.log("Element not found");
            return null;
        }

        //return result.bboxes[index];
        // Check if the detected element matches the locator

        const resultJimp = jimp.clone().crop(bbox.x, bbox.y, bbox.width, bbox.height);
        let croppedImageBuffer = await resultJimp.getBufferAsync(Jimp.MIME_PNG);

        saveData("./logs/croppedForReplay.png", croppedImageBuffer);

        let element = croppedImageBuffer.toString("base64");
        const newLocator = await getCaption(element);

        const similarity = await getSimilarity(locator, newLocator);
        if (similarity >= similarityValue) {
            let res = BoundingBox.createNewBBox(
                bbox.x * factor,
                (bbox.x + bbox.width) * factor,
                bbox.y * factor,
                (bbox.y + bbox.height) * factor
            );
            res.level = bbox.level;

            return res;
        }
        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getReplayBoundingBox(drawnBuffer: Buffer, bboxes: BoundingBox[], locator: string): Promise<BoundingBox> {
    try {
        // Draw bounding boxes for this image
        let index = -1;

        // Convert the image to base64
        const annotatedImage = drawnBuffer.toString("base64");

        const completion = await openai.beta.chat.completions.parse({
            messages: [
                { role: "system", content: LOCATE_PROMPT },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Find the index of the web element with the same visual properties as following: ${locator}`,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/png;base64,${annotatedImage}`,
                            },
                        },
                    ],
                },
            ],
            model: locate_model,
            seed: 0,
            max_tokens: 50,
            temperature: 0,
            response_format: zodResponseFormat(Result, "result"),
        });

        const response = completion.choices[0].message.parsed;
        index = response.value;

        if (index === -1) return null;

        return bboxes[index];
    } catch (error) {
        console.error(error);
        return null;
    }
}
