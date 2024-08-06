import dotenv from 'dotenv';
import OpenAI from "openai";
import { APIPromise } from 'openai/core';

dotenv.config();

const openai = new OpenAI();

let CAPTION_PROPMT = `You are an expert at captioning web element. 
Generate a single precise locator for the web element. 
Description should contains all information available such as text, background color, shape, etc. 
Only mention those properties that are visible in the element.
Locator format: [Element description based on visual].
Element description example: [button with text="Sign in", background_color="Light Blue", shape="rectangle"]
For image elements: [image description]`;

export async function getCaption(base64image: string): Promise<APIPromise<OpenAI.Chat.Completions.ChatCompletion>> {
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
        model: "gpt-4o",
        seed: 42,
        max_tokens: 30,
        temperature: 0
    });

    return response;
}