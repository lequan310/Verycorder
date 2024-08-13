import dotenv from 'dotenv';
import OpenAI from "openai";
import { drawBoxes } from './inference';

dotenv.config();

const openai = new OpenAI();

let CAPTION_PROPMT = `You are an expert at captioning web element. You are given an image of a web element.
Generate a single precise locator for the web element based on visual description.
Visual Description should contains all details available from the web element.
Example attributes of details include but not limited to text, background color, shape, icon, etc.
If the visual description includes the icon, you can describe the icon with its name if you know. Example: icon="hamburger" or icon="youtube". If you don't know the icon name, describe the icon.
If the element includes or is an icon, you can assume it is a button.

Locator format: [<Element> with description based on visual]. Element can only be button, text, input field, or image.
Element description example: [button with text="Sign in", background_color=#0b0b0b, shape="rectangle"]
For image elements, if you recognize the image, say the name of the image and the visual description. Locator format for image elements: [image of <image name> with description based on visual]
If you don't recognize the image, describe the image. Locator format for image elements: [image description based on visual]
Answer should be within 50 words.`;

let LOCATE_PROMPT = `You are an expert at locating web element based on visual description. 
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

export function getCaption(base64image: string) {
    const response = openai.chat.completions.create({
        messages: [
            { role: "system", content: CAPTION_PROPMT },
            {
                role: "user", content: [{
                    type: "image_url",
                    image_url: {
                        url: `data:image/png;base64,${base64image}`,
                        detail: "low"
                    }
                }]
            }
        ],
        model: "gpt-4o-mini",
        seed: 0,
        max_tokens: 100,
        temperature: 0,
    });

    return response;
}

export async function getReplayTargetBBox(imageBuffer: Buffer, locator: string) {
    // Draw bounding boxes for this image
    const result = await drawBoxes(imageBuffer);

    // Convert the image to base64
    const base64image = result.buffer.toString('base64');

    const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: LOCATE_PROMPT },
            {
                role: "user", content: [
                    {
                        type: "text",
                        text: `Find the index of the web element with the same visual properties as following: ${locator}. Returns -1 if the element with similar visual properties is not found.`
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/png;base64,${base64image}`,
                            detail: "low"
                        }
                    }
                ]
            }
        ],
        model: "gpt-4o",
        seed: 0,
        max_tokens: 50,
        temperature: 0,
    });

    const repsonse = completion.choices[0].message.content;

    // Return the bounding box down here
    try {
        const index = parseInt(repsonse);
        return result.bboxes[index];
    } catch (error) {
        const index = repsonse.match(/\d+/g).map(Number)[0];
        return result.bboxes[index];
    }
}