import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testModel(modelName) {
    try {
        const result = await groq.chat.completions.create({
            model: modelName,
            messages: [{ role: 'user', content: "Hello!" }]
        });
        console.log(`Success with ${modelName}:`, result.choices[0].message.content);
    } catch (e) {
        console.error(`Failed with ${modelName}:`, e.message);
    }
}

async function run() {
    await testModel("llama-3.3-70b-versatile");
    await testModel("llama-3.1-70b-versatile");
    await testModel("mixtral-8x7b-32768");
}

run();
