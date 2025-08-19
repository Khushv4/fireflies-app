using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using FirefliesBackend.Models;
using Microsoft.Extensions.Configuration;

namespace FirefliesBackend.Services
{
    public static class ChatGptService
    {
        // Generates files based on a meeting summary using OpenAI's GPT model
        public static async Task<List<FileResult>> GenerateFilesFromSummary(HttpClient client, string summary, string apiKey)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("OpenAI API key not provided.");

            if (string.IsNullOrWhiteSpace(summary))
                throw new ArgumentException("summary is required", nameof(summary));

            var allFiles = new List<FileResult>();
            bool moreNeeded = true;
            string accumulatedOutput = "";

            // Initial strict JSON prompt
            string prompt = $@"
You are a strict JSON document generator. Given the meeting summary below, generate EXACTLY three files:

1) FunctionalDoc.txt -> a detailed functional specification.
2) Mockups.txt -> textual UI/UX mockup descriptions (no images).
3) Markdown.md -> a formatted markdown document (use headings/lists as appropriate).

Return ONLY a single JSON array (no explanation, no markdown fences, no backticks) in this exact shape:

[
  {{ ""name"": ""FunctionalDoc.txt"", ""content"": ""<functional doc here>"" }},
  {{ ""name"": ""Mockups.txt"", ""content"": ""<mockups here>"" }},
  {{ ""name"": ""Markdown.md"", ""content"": ""<markdown here>"" }}
]

Meeting summary:
{summary}
".Trim();

            while (moreNeeded)
            {
                var body = new
                {
                    model = "gpt-4o-mini",
                    messages = new[]
                    {
                        new { role = "system", content = "You are a careful assistant that outputs valid JSON only." },
                        new { role = "user", content = prompt }
                    },
                    max_tokens = 2000,
                    temperature = 0.2
                };

                var requestJson = JsonSerializer.Serialize(body);
                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
                request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

                var resp = await client.SendAsync(request);
                var respText = await resp.Content.ReadAsStringAsync();

                if (!resp.IsSuccessStatusCode)
                    throw new HttpRequestException($"OpenAI request failed {resp.StatusCode}: {respText}");

                string chunk;
                try
                {
                    using var envelope = JsonDocument.Parse(respText);
                    chunk = envelope.RootElement
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString() ?? "";
                }
                catch
                {
                    chunk = respText; // fallback raw
                }

                accumulatedOutput += "\n" + chunk;

                // Check if all 3 filenames exist in the combined output
                if (accumulatedOutput.Contains("FunctionalDoc.txt") &&
                    accumulatedOutput.Contains("Mockups.txt") &&
                    accumulatedOutput.Contains("Markdown.md"))
                {
                    moreNeeded = false;
                }
                else
                {
                    prompt = "continue"; // trigger more generation
                }
            }

            // Once full output collected → parse as JSON defensively
            allFiles = ParseJsonFiles(accumulatedOutput);

            return allFiles;
        }

        // Parses the assistant's text response to extract file results
        private static List<FileResult> ParseJsonFiles(string assistantText)
        {
            var cleaned = StripCodeFences(assistantText);
            var jsonCandidate = ExtractJsonSubstring(cleaned) ?? cleaned;

            List<FileResultDto> parsedDtos = null;

            // 1) Try parse as array
            try
            {
                parsedDtos = JsonSerializer.Deserialize<List<FileResultDto>>(jsonCandidate,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch { }

            // 2) Try object shape
            if (parsedDtos == null)
            {
                try
                {
                    var obj = JsonSerializer.Deserialize<JsonElement>(jsonCandidate);
                    if (obj.ValueKind == JsonValueKind.Object)
                    {
                        var temp = new List<FileResultDto>();
                        if (obj.TryGetProperty("FunctionalDoc", out var fd))
                            temp.Add(new FileResultDto { name = "FunctionalDoc.txt", content = fd.GetString() ?? "" });
                        if (obj.TryGetProperty("Mockups", out var mo))
                            temp.Add(new FileResultDto { name = "Mockups.txt", content = mo.GetString() ?? "" });
                        if (obj.TryGetProperty("Markdown", out var md))
                            temp.Add(new FileResultDto { name = "Markdown.md", content = md.GetString() ?? "" });
                        parsedDtos = temp;
                    }
                }
                catch { }
            }

            if (parsedDtos == null || parsedDtos.Count == 0)
            {
                return new List<FileResult>
                {
                    new FileResult { Name = "FunctionalDoc.txt", Content = "Failed to parse model output." },
                    new FileResult { Name = "Mockups.txt", Content = "Failed to parse model output." },
                    new FileResult { Name = "Markdown.md", Content = "Failed to parse model output." }
                };
            }

            // Normalize
            return new List<FileResult>
            {
                ToFileResult(parsedDtos, "FunctionalDoc.txt"),
                ToFileResult(parsedDtos, "Mockups.txt"),
                ToFileResult(parsedDtos, "Markdown.md")
            };
        }

        // Converts a list of FileResultDto to a FileResult with the specified filename
        private static FileResult ToFileResult(List<FileResultDto> items, string filename)
        {
            var match = items.Find(x => string.Equals(x.name?.Trim(), filename, StringComparison.OrdinalIgnoreCase));
            return new FileResult
            {
                Name = filename,
                Content = match?.content ?? ""
            };
        }

        // Helper methods to clean up the response text
        private static string StripCodeFences(string s)
        {
            if (string.IsNullOrEmpty(s)) return s;
            s = Regex.Replace(s, @"^```(?:json)?\s*", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
            s = Regex.Replace(s, @"\s*```$", "", RegexOptions.Singleline);
            return s.Trim();
        }

        // Extracts a valid JSON substring from the response text
        // This handles both array and object formats
        private static string ExtractJsonSubstring(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;
            var arrayMatch = FindBalancedJson(s, '[', ']');
            if (arrayMatch != null) return arrayMatch;
            return FindBalancedJson(s, '{', '}');
        }

        
        // Finds a balanced JSON substring in the input string
        // This is used to extract the JSON array or object from the response text
        private static string FindBalancedJson(string s, char openChar, char closeChar)
        {
            int start = s.IndexOf(openChar);
            if (start < 0) return null;

            int depth = 0;
            for (int i = start; i < s.Length; i++)
            {
                if (s[i] == openChar) depth++;
                else if (s[i] == closeChar) depth--;

                if (depth == 0)
                {
                    var candidate = s.Substring(start, i - start + 1);
                    try
                    {
                        JsonDocument.Parse(candidate);
                        return candidate;
                    }
                    catch { }
                }
            }
            return null;
        }

        // DTO for deserializing the file results
        // This is used to map the JSON response to a C# object
        private class FileResultDto
        {
            public string name { get; set; } = "";
            public string content { get; set; } = "";
        }
    }
}