using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using FirefliesBackend.Models;

namespace FirefliesBackend.Services
{
    // Service for generating project plans
    public static class ProjectPlanService
    {
        private const int MAX_TOKENS_PER_REQUEST = 16000; // Safe limit for GPT-4o-mini
        private const int CHARS_PER_TOKEN = 4; // Rough estimate
        private const int SMART_TRUNCATION_LIMIT = 50000; // New: Smart truncation threshold

        // Generates a detailed project plan based on functional documents, mockups, and markdown
        public static async Task<string> GenerateProjectPlan(
            HttpClient client, 
            string functionalDoc, 
            string mockups, 
            string markdown, 
            int durationWeeks, 
            string additionalDetails, 
            string apiKey)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("OpenAI API key not provided.");

            // NEW: Use Smart Document Truncation instead of summarization
            var optimizedDocs = OptimizeDocumentsForProjectPlan(functionalDoc, mockups, markdown, additionalDetails);

            var prompt = $@"
You are a senior project manager creating a detailed project plan. Based on the provided documents, create a comprehensive project plan for {durationWeeks} weeks.

IMPORTANT: The documents below have been optimized to include only the most critical information for project planning.

{optimizedDocs}

Generate a detailed project plan with the following structure:
1. **Project Overview** - Summary of the project goals and scope
2. **Phase Breakdown** - Divide the {durationWeeks} weeks into logical phases
3. **Weekly Milestones** - Specific deliverables for each week
4. **Resource Requirements** - Team members, tools, and technologies needed
5. **Risk Assessment** - Potential challenges and mitigation strategies
6. **Timeline** - Visual timeline with dependencies
7. **Success Metrics** - How to measure project success

FORMAT:
- Use markdown headers (##, ###)
- Create tables for daily schedules
- Keep descriptions concise but actionable
- Assume 5 working days per week
- Focus on deliverables, not processes

DAILY SCHEDULE FORMAT:
| Week | Day | Task | Deliverable | Owner |
|------|-----|------|------------|-------|

Be specific, realistic, and ensure tasks build upon each other logically.
".Trim();

            var body = new
            {
                model = "gpt-4o-mini",
                messages = new[]
                {
                    new { role = "system", content = "You are an expert project manager who creates detailed, actionable project plans." },
                    new { role = "user", content = prompt }
                },
                max_tokens = 4000,
                temperature = 0.3
            };

            var requestJson = JsonSerializer.Serialize(body);
            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            var responseText = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException($"OpenAI request failed {response.StatusCode}: {responseText}");

            try
            {
                using var envelope = JsonDocument.Parse(responseText);
                var content = envelope.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString() ?? "";

                return content;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to parse OpenAI response: {ex.Message}");
            }
        }

        // NEW: Smart Document Truncation Implementation
        private static string OptimizeDocumentsForProjectPlan(string functionalDoc, string mockups, string markdown, string additionalDetails)
        {
            var sections = new List<DocumentSection>
            {
                new DocumentSection(1, "🎯 FUNCTIONAL REQUIREMENTS", ExtractKeyContent(functionalDoc, DocumentType.Functional)),
                new DocumentSection(2, "⚙️ TECHNICAL SPECIFICATIONS", ExtractKeyContent(markdown, DocumentType.Technical)),
                new DocumentSection(3, "🎨 USER INTERFACE & MOCKUPS", ExtractKeyContent(mockups, DocumentType.Mockups)),
                new DocumentSection(4, "📋 ADDITIONAL CONTEXT", additionalDetails ?? "")
            };

            var totalLength = sections.Sum(s => s.Content.Length);
            
            if (totalLength <= SMART_TRUNCATION_LIMIT)
            {
                return BuildOptimizedOutput(sections, totalLength);
            }

            // Smart truncation - prioritize most important content
            return TruncateIntelligently(sections, SMART_TRUNCATION_LIMIT);
        }

        // Extracts key content from the provided document based on type
        private static string ExtractKeyContent(string document, DocumentType type)
        {
            if (string.IsNullOrEmpty(document)) return "";

            return type switch
            {
                DocumentType.Functional => ExtractFunctionalKeys(document),
                DocumentType.Technical => ExtractTechnicalKeys(document),
                DocumentType.Mockups => ExtractMockupKeys(document),
                _ => document
            };
        }

        // Extracts key functional requirements from the document
        private static string ExtractFunctionalKeys(string doc)
        {
            // Extract: requirements, features, user stories, acceptance criteria
            var keyPatterns = new[]
            {
                @"(?i).*?(requirement|feature|user story|acceptance criteria|must have|should have|need to|needs to).*?(?=\n|$)",
                @"(?i).*?(purpose|goal|objective|scope|deliverable|functionality).*?(?=\n|$)",
                @"(?i).*?(behavior|workflow|business rule|constraint|specification).*?(?=\n|$)"
            };

            var extractedContent = ExtractByPatterns(doc, keyPatterns);
            
            // If no patterns match, return first portion (fallback)
            if (string.IsNullOrEmpty(extractedContent))
            {
                return doc.Length > 3000 ? doc.Substring(0, 3000) + "\n[...truncated for brevity...]" : doc;
            }

            return extractedContent;
        }

        // Extracts key technical specifications from the document
        private static string ExtractTechnicalKeys(string doc)
        {
            // Extract: tech stack, architecture, APIs, database, frameworks
            var keyPatterns = new[]
            {
                @"(?i).*?(technology|tech stack|framework|library|api|database|architecture).*?(?=\n|$)",
                @"(?i).*?(backend|frontend|integration|deployment|security|hosting|cloud).*?(?=\n|$)",
                @"(?i).*?(react|node|angular|vue|python|java|\.net|sql|mongodb|aws|azure).*?(?=\n|$)",
                @"(?i).*?(performance|scalability|authentication|authorization).*?(?=\n|$)"
            };

            var extractedContent = ExtractByPatterns(doc, keyPatterns);
            
            if (string.IsNullOrEmpty(extractedContent))
            {
                return doc.Length > 2500 ? doc.Substring(0, 2500) + "\n[...truncated for brevity...]" : doc;
            }

            return extractedContent;
        }

        // Extracts key mockup and UI elements from the document
        private static string ExtractMockupKeys(string doc)
        {
            // Extract: screens, components, user flows, navigation, UI elements
            var keyPatterns = new[]
            {
                @"(?i).*?(screen|page|component|button|form|navigation|layout|ui|ux|interface).*?(?=\n|$)",
                @"(?i).*?(user flow|user journey|interaction|workflow|dashboard|menu).*?(?=\n|$)",
                @"(?i).*?(design|mockup|wireframe|prototype|responsive|mobile|desktop).*?(?=\n|$)"
            };

            var extractedContent = ExtractByPatterns(doc, keyPatterns);
            
            if (string.IsNullOrEmpty(extractedContent))
            {
                return doc.Length > 2000 ? doc.Substring(0, 2000) + "\n[...truncated for brevity...]" : doc;
            }

            return extractedContent;
        }

        // Extracts content based on multiple regex patterns
        private static string ExtractByPatterns(string text, string[] patterns)
        {
            var matches = new List<string>();
            
            foreach (var pattern in patterns)
            {
                try
                {
                    var regex = new Regex(pattern, RegexOptions.Multiline | RegexOptions.IgnoreCase);
                    var regexMatches = regex.Matches(text);
                    
                    foreach (Match match in regexMatches)
                    {
                        var cleanMatch = match.Value.Trim();
                        if (cleanMatch.Length > 10 && !matches.Contains(cleanMatch)) // Avoid duplicates and tiny matches
                        {
                            matches.Add(cleanMatch);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Regex error: {ex.Message}");
                }
            }

            // Limit to top 15 matches per document to prevent overwhelming
            return string.Join("\n", matches.Take(15));
        }

        // Builds the final output string from the optimized sections
        private static string BuildOptimizedOutput(List<DocumentSection> sections, int totalLength)
        {
            var result = new StringBuilder();
            result.AppendLine($"=== OPTIMIZED PROJECT DOCUMENTATION ({totalLength:N0} characters) ===\n");

            foreach (var section in sections.OrderBy(s => s.Priority))
            {
                if (string.IsNullOrEmpty(section.Content)) continue;
                
                result.AppendLine($"## {section.Title}");
                result.AppendLine(section.Content);
                result.AppendLine();
            }

            return result.ToString();
        }

        // Smart truncation of sections based on priority and content length
        private static string TruncateIntelligently(List<DocumentSection> sections, int maxChars)
        { 
            var result = new StringBuilder();
            result.AppendLine($"=== SMART-TRUNCATED PROJECT DOCUMENTATION (optimized from larger source) ===\n");
            
            var remainingChars = maxChars - 100; // Reserve for headers and formatting

            // Priority allocation: Functional(40%), Technical(30%), Mockups(20%), Additional(10%)
            var allocations = new Dictionary<int, double>
            {
                [1] = 0.40, // Functional Requirements
                [2] = 0.30, // Technical Specifications  
                [3] = 0.20, // UI/Mockups
                [4] = 0.10  // Additional Details
            };

            foreach (var section in sections.OrderBy(s => s.Priority))
            {
                if (string.IsNullOrEmpty(section.Content)) continue;

                var sectionHeader = $"## {section.Title}\n";
                var allocatedChars = (int)(remainingChars * allocations.GetValueOrDefault(section.Priority, 0.1));
                
                result.Append(sectionHeader);
                
                if (section.Content.Length <= allocatedChars)
                {
                    result.AppendLine(section.Content);
                }
                else
                {
                    // Smart truncation: try to end at sentence boundary
                    var truncated = section.Content.Substring(0, allocatedChars - 50);
                    var lastPeriod = truncated.LastIndexOf('.');
                    var lastNewline = truncated.LastIndexOf('\n');
                    
                    var cutPoint = Math.Max(lastPeriod, lastNewline);
                    if (cutPoint > allocatedChars / 2) // Only cut at boundary if it's reasonable
                    {
                        truncated = section.Content.Substring(0, cutPoint + 1);
                    }
                    
                    result.AppendLine(truncated);
                    result.AppendLine("[...additional content truncated for API optimization...]");
                }
                
                result.AppendLine();
            }

            return result.ToString();
        }

        // Keep the old summarization method as fallback (optional)
        [Obsolete("Use OptimizeDocumentsForProjectPlan instead for better cost efficiency")]
        private static async Task<string> SummarizeDocuments(HttpClient client, string docs, string apiKey)
        {
            // Original summarization logic - kept for backwards compatibility if needed
            var summarizePrompt = @"
Summarize the following technical documents while preserving all key technical details, requirements, features, and implementation specifics. 
Keep the summary comprehensive but concise:

" + docs;

            var body = new
            {
                model = "gpt-4o-mini",
                messages = new[]
                {
                    new { role = "system", content = "You are a technical writer who creates concise but comprehensive summaries of technical documents." },
                    new { role = "user", content = summarizePrompt }
                },
                max_tokens = 3000,
                temperature = 0.2
            };

            var requestJson = JsonSerializer.Serialize(body);
            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            var responseText = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException($"OpenAI request failed during summarization {response.StatusCode}: {responseText}");

            try
            {
                using var envelope = JsonDocument.Parse(responseText);
                return envelope.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString() ?? docs; // Fallback to original if parsing fails
            }
            catch
            {
                return docs; // Fallback to original docs
            }
        }

        // Supporting classes
        private record DocumentSection(int Priority, string Title, string Content);
        
        private enum DocumentType 
        { 
            Functional, 
            Technical, 
            Mockups 
        }
    }
}