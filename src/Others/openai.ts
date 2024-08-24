import dotenv from "dotenv";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getAndDrawBoxes } from "./inference";
import { BoundingBox } from "../Types/bbox";
import { cropImageBuffer } from "./inference";
import Jimp from "jimp";
import { compareImages } from "./opencv";
import * as fs from "fs";

const Result = z.object({
    value: z.number(),
});

dotenv.config();

const openai = new OpenAI();
const caption_model = "gpt-4-turbo";
const locate_model = "gpt-4o-2024-08-06";
const embed_model = "text-embedding-3-large";

const CAPTION_PROPMT = `You are an expert at captioning web element. You are given an image of a web element.
Generate a single precise locator for the web element based on visual description.
Visual Description should contains all details available from the web element.
Example attributes of details include but not limited to text, background color, shape, icon, etc.
If the visual description includes the icon, you can describe the icon with its name if you know. Example: icon="hamburger" or icon="youtube". If you don't know the icon name, describe the icon.
If the element includes or is an icon, you can assume it is a button.

Locator format: [<Element> with description based on visual]. Element can only be button, text, input field, or image.
Element description example: [button with text="Sign in", background_color="Light Purple", shape="rectangle"]
For image elements, if you recognize the image, say the name of the image and the visual description. Locator format for image elements: [image of <image name> with description based on visual]
If you don't recognize the image, describe the image. Locator format for image elements: [image description based on visual]
Answer should be within 50 words.`;

const LOCATE_PROMPT = `You are an expert at locating web element based on visual description. 
You are provided a screenshot of a web page with bounding boxes around the web elements and the index number on the TOP LEFT of the corresponding bounding box.
You are also provided with a visual description of a web element.
Numbers may be hard to see, but they should have the same color with the corresponding bounding box.

You should do the following steps to improve your accuracy after receving the image and the description:
1. Go through each bounding box from left to right, top to bottom.
2. For each web element within the bounding box, identify whether they match the visual description.
For an element to match the visual description, it must contain all the features provided in the visual description.
For example, if the element locator is [button with text="Sign in", background_color=#0b0b0b, shape="rectangle"], the element must have the text "Sign in", background color #0b0b0b, and shape "rectangle".
3. If the web element matches the visual description, provide the index number of the bounding box and stop the process.
4. After going through all the web elements, if no element matches the visual description, answer -1.

Give a single number, which is the index of the bounding box, as the answer.

Begin!
`;

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

async function getSimilarity(
    locator: string,
    newLocator: string
): Promise<number> {
    const embeddingObject = await openai.embeddings.create({
        model: embed_model,
        input: locator.replace("[", "").replace("]", ""),
        encoding_format: "float",
    });

    const newEmbeddingObject = await openai.embeddings.create({
        model: embed_model,
        input: newLocator.replace("[", "").replace("]", ""),
        encoding_format: "float",
    });

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
    clickedBuffer: Buffer = null,
): Promise<BoundingBox> {
    try {
        console.log("Getting target bounding box");
        const jimp = await Jimp.read(imageBuffer);
        let width = 1248;
        let factor = jimp.getWidth() / width;
        jimp.resize(width, Jimp.AUTO);
        
        let clickedJimp = await Jimp.read(Buffer.from(clickedBuffer));
        clickedJimp.resize(clickedJimp.getWidth() / factor, Jimp.AUTO);
        clickedJimp.writeAsync("./logs/clickedImage.png");
        
        let result = await getAndDrawBoxes(await jimp.getBufferAsync(Jimp.MIME_PNG));

        fs.writeFileSync("./logs/drawnForReplay.png", result.buffer);

        let bbox = await getReplayBoundingBox(result.buffer, result.bboxes, locator);

        if (bbox == null) {
            console.log("Element not found");
            return null;
        }

        let jimpImg = jimp.clone().crop(bbox.x, bbox.y, bbox.width, bbox.height);
        //return result.bboxes[index];
        // Check if the detected element matches the locator
        if (clickedBuffer == null) {
            let croppedImageBuffer = await cropImageBuffer(imageBuffer, bbox);
            let element = croppedImageBuffer.toString("base64");
            const newLocator = await getCaption(element);

            const similarity = await getSimilarity(locator, newLocator);
            if (similarity >= similarityValue) return bbox;
        } else {
            jimpImg.writeAsync("./logs/foundImage.png");
            let resultBuffer = await jimpImg.getBufferAsync(Jimp.MIME_PNG);
            let score = await compareImages(await clickedJimp.getBufferAsync(Jimp.MIME_PNG), resultBuffer);
            console.log("score:", score);
            if (score < 1) {
                let res = BoundingBox.createNewBBox(
                    bbox.x * factor,
                    (bbox.x + bbox.width) * factor,
                    bbox.y * factor,
                    (bbox.y + bbox.height) * factor
                );
                res.level = bbox.level;

                return res;
            }
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
                            text: `Find the index of the web element with the same visual properties as following: ${locator}. Returns -1 if the element with similar visual properties is not found.`,
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
