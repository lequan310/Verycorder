import dotenv from 'dotenv';
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI();

let CAPTION_PROPMT = `You are an expert at captioning web element. You are given an image of a web element.
Generate a single precise locator for the web element based on visual description.
Visual Description should contains all details available from the web element.
Example attributes of details include but not limited to text, background color, shape, icon, etc.
Only mention those properties that are visible in the element.
Locator format: [Element description based on visual].
Element description example: [button with text="Sign in", background_color="Light Blue", shape="rectangle"]
For image elements, describe the details of the image.
Locator format for image elements: [image description]`;

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
        seed: 42,
        max_tokens: 50,
        temperature: 0,
    });

    return response;
}