using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FirefliesBackend.Services
{
    // Service for generating project backlogs from project plans
    public static class BacklogService
    {
        private const int MAX_TOKENS = 4000;

        // Generates a detailed backlog based on project plan
        public static async Task<string> GenerateBacklogFromProjectPlan(
            HttpClient client, 
            string projectPlan, 
            string apiKey)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("OpenAI API key not provided.");

            if (string.IsNullOrWhiteSpace(projectPlan))
                throw new ArgumentException("Project plan is required", nameof(projectPlan));

            // Optimize project plan content if it's too long
            var optimizedPlan = OptimizePlanForBacklog(projectPlan);

            var prompt = $@"
You are a senior product manager creating a comprehensive product backlog from a project plan. 

Based on the project plan below, create a detailed product backlog with the following structure:

## Product Backlog

### Epic Structure
Break down the project into 3-5 major epics that represent key functional areas.

### User Stories
For each epic, create detailed user stories in the format:
- **Story ID**: [Epic-Number] (e.g., E1-US01)
- **Title**: Brief, action-oriented title
- **User Story**: As a [user type], I want [functionality] so that [benefit]
- **Acceptance Criteria**: Specific, testable criteria (3-5 bullets)
- **Story Points**: Fibonacci estimate (1, 2, 3, 5, 8, 13)
- **Priority**: High/Medium/Low
- **Dependencies**: Other stories this depends on

### Sprint Planning Suggestions
- Recommend story groupings for 2-week sprints
- Highlight critical path items
- Note stories that can run in parallel

### Definition of Done
- Code complete and reviewed
- Unit tests written and passing
- Integration tests passing
- Documentation updated
- Acceptance criteria verified

PROJECT PLAN:
{optimizedPlan}

FORMAT: Use markdown with clear headers, tables where appropriate, and bullet points for readability.
FOCUS: Prioritize user value, technical feasibility, and logical development sequence.
ESTIMATE: Be realistic with story points based on complexity and dependencies.
".Trim();

            var body = new
            {
                model = "gpt-4o-mini",
                messages = new[]
                {
                    new { role = "system", content = "You are an expert product manager who creates comprehensive, well-structured product backlogs from project plans." },
                    new { role = "user", content = prompt }
                },
                max_tokens = MAX_TOKENS,
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

        // Optimizes project plan content for backlog generation
        private static string OptimizePlanForBacklog(string projectPlan)
        {
            if (string.IsNullOrEmpty(projectPlan)) return "";

            // If plan is too long, extract key sections for backlog generation
            const int MAX_CHARS = 15000; // Conservative limit for GPT context

            if (projectPlan.Length <= MAX_CHARS)
                return projectPlan;

            // Extract key sections that are most relevant for backlog creation
            var keyPhrases = new[]
            {
                "deliverable", "milestone", "feature", "requirement", "user story",
                "functionality", "component", "module", "task", "phase",
                "week", "sprint", "development", "implementation", "testing",
                "integration", "deployment", "review", "approval"
            };

            var lines = projectPlan.Split('\n');
            var relevantLines = new List<string>();
            var totalChars = 0;

            // Prioritize lines containing key phrases
            var priorityLines = lines
                .Where(line => keyPhrases.Any(phrase => 
                    line.Contains(phrase, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            foreach (var line in priorityLines)
            {
                if (totalChars + line.Length > MAX_CHARS) break;
                relevantLines.Add(line);
                totalChars += line.Length;
            }

            // Add remaining lines if space allows
            foreach (var line in lines.Except(priorityLines))
            {
                if (totalChars + line.Length > MAX_CHARS) break;
                relevantLines.Add(line);
                totalChars += line.Length;
            }

            var optimized = string.Join("\n", relevantLines);
            
            if (optimized.Length < projectPlan.Length)
            {
                optimized += "\n\n[...additional project plan content omitted for optimization...]";
            }

            return optimized;
        }
    }
}