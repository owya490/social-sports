"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterService = void 0;
class OpenRouterService {
    constructor(config) {
        this.model = "deepseek/deepseek-chat-v3.1:free";
        this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
        this.apiToken = config.openRouterApiToken;
    }
    /**
     * Analyzes content using OpenRouter's LLM
     */
    async analyzeContent(request) {
        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    "HTTP-Referer": "https://sportshub.ai",
                    "X-Title": "Sportshub CLI",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "user",
                            content: `${request.prompt}

Content to analyze:
${request.content.slice(0, request.maxTokens || 20000)}${request.content.length > (request.maxTokens || 20000) ? "...[truncated]" : ""}`,
                        },
                    ],
                }),
            });
            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
            }
            const data = (await response.json());
            const summary = data.choices?.[0]?.message?.content?.trim();
            if (!summary) {
                throw new Error("No summary generated from OpenRouter API");
            }
            return { summary };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : "Unknown error occurred during AI analysis",
            };
        }
    }
    /**
     * Analyzes website content with a specific prompt for lead analysis
     */
    async analyzeWebsiteContent(websiteText) {
        const prompt = `Please analyze the following website content and provide a summary in 3-5 bullet points about what this organization/business does. Focus on their main activities, target audience, and any sports/fitness related content. Keep each bullet point concise and under 20 words. Please also return in markdown format.`;
        return this.analyzeContent({
            content: websiteText,
            prompt,
            maxTokens: 20000,
        });
    }
    /**
     * Summarizes file content into concise bullet points
     */
    async summarizeFileContent(fileText) {
        const prompt = `Please analyze the following text content and provide a concise summary in bullet points (maximum 10 bullet points). Focus on the key points, main topics, and important information. Keep each bullet point clear and under 25 words. Format the response in markdown.`;
        return this.analyzeContent({
            content: fileText,
            prompt,
            maxTokens: 20000,
        });
    }
}
exports.OpenRouterService = OpenRouterService;
//# sourceMappingURL=openrouter.js.map