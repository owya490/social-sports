import { JiraConfig } from "../types/config";
export interface OpenRouterAnalysisRequest {
    content: string;
    prompt: string;
    maxTokens?: number;
}
export interface OpenRouterAnalysisResponse {
    summary?: string;
    error?: string;
}
export declare class OpenRouterService {
    private apiToken;
    private readonly model;
    private readonly baseUrl;
    constructor(config: JiraConfig);
    /**
     * Analyzes content using OpenRouter's LLM
     */
    analyzeContent(request: OpenRouterAnalysisRequest): Promise<OpenRouterAnalysisResponse>;
    /**
     * Analyzes website content with a specific prompt for lead analysis
     */
    analyzeWebsiteContent(websiteText: string): Promise<OpenRouterAnalysisResponse>;
    /**
     * Summarizes file content into concise bullet points
     */
    summarizeFileContent(fileText: string): Promise<OpenRouterAnalysisResponse>;
}
//# sourceMappingURL=openrouter.d.ts.map