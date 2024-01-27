export function tokenizeText(text: string): string[] {
    // Split the text into words, convert to lowercase, and filter out empty strings
    return text.toLowerCase().split(/\s+/).filter(Boolean);
}
