import dotenv from 'dotenv';
import OpenAI from "openai";

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
        max_tokens: 100,
        temperature: 0,
    });

    return response;
}