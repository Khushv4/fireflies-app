
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using FirefliesBackend.Data;
using FirefliesBackend.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using FirefliesBackend.Services;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using FileResultModel = FirefliesBackend.Models.FileResult;

namespace FirefliesBackend.Controllers
{
    [ApiController]
    [Route("api/meetings")]
    public class MeetingsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public MeetingsController(AppDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllMeetings()
        {
            var meetings = await _db.Meetings
                .OrderByDescending(m => m.MeetingDate)
                .Select(m => new
                {
                    id = m.Id,
                    firefliesId = m.FirefliesId,
                    title = m.Title,
                    createdAt = m.CreatedAt,

                    meetingDate = m.MeetingDate,
                    summary = m.Summary,
                    hasProjectPlan = !string.IsNullOrEmpty(m.ProjectPlan),
                    durationSeconds = m.DurationSeconds  
                })
                .ToListAsync();

            return Ok(meetings);
        }

        //no changes but needed to change the download file name
        [HttpGet("{id}/download-summary")]
        public async Task<IActionResult> DownloadSummary(int id)
        {
            var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == id);
            if (meeting == null)
                return NotFound("Meeting not found");

            var textContent = $"Meeting Title: {meeting.Title}\nDate: {meeting.MeetingDate}\n\nSummary:\n{meeting.Summary}";
            var bytes = Encoding.UTF8.GetBytes(textContent);
            return File(bytes, "text/plain", "summary.txt");
        }

        [HttpPost("upsert")]
        public async Task<IActionResult> UpsertMeeting([FromBody] SaveMeetingDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.FirefliesId))
            {
                return BadRequest("Invalid payload - FirefliesId required.");
            }

            try
            {
                var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.FirefliesId == dto.FirefliesId);

                if (meeting == null)
                {
                    meeting = new Meeting { FirefliesId = dto.FirefliesId };
                    _db.Meetings.Add(meeting);
                }

                // Update all properties from the DTO
                meeting.Title = dto.Title ?? "";
                
                    Console.WriteLine($"[LOG 2 - MeetingsController UPSERT]: Frontend se aayi date: {dto.MeetingDate}, Kind: {dto.MeetingDate?.Kind}");


                // ✅ YAHI HAI ASLI AUR FINAL FIX
                if (dto.MeetingDate.HasValue)
                {
                    meeting.MeetingDate = DateTime.SpecifyKind(dto.MeetingDate.Value, DateTimeKind.Utc);
                }
                else
                {
                    meeting.MeetingDate = null;
                }
                
                meeting.DurationSeconds = (int)Math.Round(dto.DurationSeconds);
                meeting.TranscriptJson = dto.TranscriptJson ?? "";
                meeting.Summary = dto.Summary ?? "";
                meeting.BulletGist = dto.BulletGist;
                meeting.ActionItems = dto.ActionItems;
                meeting.Keywords = dto.Keywords;
                meeting.ExtendedSectionsJson = dto.ExtendedSectionsJson;
                meeting.AudioUrl = dto.AudioUrl;
                
                await _db.SaveChangesAsync();
                return Ok(new { id = meeting.Id, firefliesId = meeting.FirefliesId });
            }
            catch (Exception ex)
            {
                Console.WriteLine("DB Upsert failed: " + ex);
                return StatusCode(500, "Database save failed. Check server logs.");
            }
        }

           [HttpPut("{id}/summary")]
        public async Task<IActionResult> UpdateSummary(int id, [FromBody] UpdateSummaryDto dto)
        {
            var m = await _db.Meetings.FindAsync(id);
            if (m == null) return NotFound();
            m.UserEditedSummary = dto.Summary; 
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/preferences")]
        public async Task<IActionResult> UpdatePreferences(int id, [FromBody] UpdatePreferencesDto dto)
        {
            var meeting = await _db.Meetings.FindAsync(id);
            if (meeting == null)
            {
                return NotFound();
            }
            meeting.SummaryPreferencesJson = JsonSerializer.Serialize(dto.Preferences);
            await _db.SaveChangesAsync();
            return NoContent();
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var m = await _db.Meetings.FindAsync(id);
            if (m == null) return NotFound();

            return Ok(new
            {
                m.Id,
                m.FirefliesId,
                m.Title,
                meetingDate = m.MeetingDate,
                m.DurationSeconds,
                m.Summary,
                m.TranscriptJson,
                hasProjectPlan = !string.IsNullOrEmpty(m.ProjectPlan)
            });
        }

        [HttpPost("{id}/generate-files")]
        public async Task<IActionResult> GenerateFilesFromDbSummary(int id)
        {
            var meeting = await _db.Meetings.FindAsync(id);
            if (meeting == null || string.IsNullOrWhiteSpace(meeting.Summary))
                return NotFound("Meeting or summary not found.");

            if (!string.IsNullOrWhiteSpace(meeting.GeneratedFilesJson))
            {
                try
                {
                    var existingFiles = JsonSerializer.Deserialize<List<FileResultModel>>(meeting.GeneratedFilesJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (existingFiles != null && existingFiles.Count > 0)
                        return Ok(existingFiles);
                }
                catch
                {
                    // ignore
                }
            }

            var apiKey = _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
                return StatusCode(500, "OpenAI API key not configured.");

            var client = _httpClientFactory.CreateClient("OpenAI");
            List<FileResultModel> files;
            try
            {
                files = await ChatGptService.GenerateFilesFromSummary(client, meeting.Summary, apiKey);
            }
            catch (Exception ex)
            {
                Console.WriteLine("GenerateFilesFromSummary failed: " + ex);
                return StatusCode(500, "Failed generating files.");
            }

            meeting.FunctionalDoc = files.FirstOrDefault(f => f.Name == "FunctionalDoc.txt")?.Content ?? "";
            meeting.Mockups = files.FirstOrDefault(f => f.Name == "Mockups.txt")?.Content ?? "";
            meeting.Markdown = files.FirstOrDefault(f => f.Name == "Markdown.md")?.Content ?? "";
            meeting.GeneratedFilesJson = JsonSerializer.Serialize(files);

            await _db.SaveChangesAsync();

            return Ok(files);
        }

        [HttpGet("{id}/files")]
        public async Task<IActionResult> GetFilesForMeeting(int id)
        {
            var meeting = await _db.Meetings.FindAsync(id);
            if (meeting == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(meeting.GeneratedFilesJson))
            {
                try
                {
                    var files = JsonSerializer.Deserialize<List<FileResultModel>>(meeting.GeneratedFilesJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (files != null && files.Count > 0)
                        return Ok(files);
                }
                catch { }
            }

            var built = new List<FileResultModel>
            {
                new FileResultModel { Name = "FunctionalDoc.txt", Content = meeting.FunctionalDoc ?? "" },
                new FileResultModel { Name = "Mockups.txt", Content = meeting.Mockups ?? "" },
                new FileResultModel { Name = "Markdown.md", Content = meeting.Markdown ?? "" }
            };

            return Ok(built);
        }

        [HttpPut("{id}/files")]
        public async Task<IActionResult> UpdateFiles(int id, [FromBody] List<FileResultModel> files)
        {
            var meeting = await _db.Meetings.FindAsync(id);
            if (meeting == null) return NotFound();

            if (files == null || files.Count == 0) return BadRequest("Files are required.");

            meeting.FunctionalDoc = files.FirstOrDefault(f => f.Name == "FunctionalDoc.txt")?.Content ?? meeting.FunctionalDoc;
            meeting.Mockups = files.FirstOrDefault(f => f.Name == "Mockups.txt")?.Content ?? meeting.Mockups;
            meeting.Markdown = files.FirstOrDefault(f => f.Name == "Markdown.md")?.Content ?? meeting.Markdown;
            meeting.GeneratedFilesJson = JsonSerializer.Serialize(files);

            await _db.SaveChangesAsync();
            return Ok(new { message = "Files updated." });
        }

        [HttpPost("{id}/generate-project-plan")]
        public async Task<IActionResult> GenerateProjectPlan(int id, [FromBody] GenerateProjectPlanRequest request)
        {
            if (request == null || request.DurationWeeks <= 0)
                return BadRequest("Invalid request - duration must be greater than 0.");

            var meeting = await _db.Meetings.FindAsync(id);
            if (meeting == null)
                return NotFound("Meeting not found.");

            // ✅ Prevent regeneration
            if (!string.IsNullOrWhiteSpace(meeting.ProjectPlan))
            {
                return BadRequest("Project plan already exists. You cannot generate it again.");
            }

            if (string.IsNullOrWhiteSpace(meeting.FunctionalDoc) &&
                string.IsNullOrWhiteSpace(meeting.Mockups) &&
                string.IsNullOrWhiteSpace(meeting.Markdown))
            {
                return BadRequest("No generated files found. Please generate files first.");
            }

            var apiKey = _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
                return StatusCode(500, "OpenAI API key not configured.");

            try
            {
                var client = _httpClientFactory.CreateClient("OpenAI");

                var projectPlan = await ProjectPlanService.GenerateProjectPlan(
                    client,
                    meeting.FunctionalDoc ?? "",
                    meeting.Mockups ?? "",
                    meeting.Markdown ?? "",
                    request.DurationWeeks,
                    request.AdditionalDetails ?? "",
                    apiKey
                );

                meeting.ProjectPlan = projectPlan;
                meeting.ProjectDurationWeeks = request.DurationWeeks;
                meeting.ProjectDetails = request.AdditionalDetails ?? "";
                meeting.ProjectPlanGeneratedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new ProjectPlanResponse
                {
                    MeetingId = id,
                    ProjectPlan = projectPlan,
                    DurationWeeks = request.DurationWeeks,
                    AdditionalDetails = request.AdditionalDetails ?? "",
                    GeneratedAt = meeting.ProjectPlanGeneratedAt.Value
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Generate project plan failed: {ex}");
                return StatusCode(500, "Failed to generate project plan.");
            }
        }

        [HttpGet("{id}/project-plan")]
        public async Task<IActionResult> GetProjectPlan(int id)
        {
            var meeting = await _db.Meetings.FindAsync(id);
            if (meeting == null) return NotFound();

            if (string.IsNullOrWhiteSpace(meeting.ProjectPlan))
                return NotFound("No project plan found for this meeting.");

            return Ok(new ProjectPlanResponse
            {
                MeetingId = id,
                ProjectPlan = meeting.ProjectPlan,
                DurationWeeks = meeting.ProjectDurationWeeks ?? 0,
                AdditionalDetails = meeting.ProjectDetails ?? "",
                GeneratedAt = meeting.ProjectPlanGeneratedAt ?? DateTime.MinValue
            });
        }

        [HttpPut("{id}/project-plan")]
        public async Task<IActionResult> UpdateProjectPlan(int id, [FromBody] UpdateProjectPlanDto dto)
        {
            var meeting = await _db.Meetings.FindAsync(id);
            if (meeting == null) return NotFound();

            meeting.ProjectPlan = dto.ProjectPlan ?? meeting.ProjectPlan;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Project plan updated." });
        }

        [HttpGet("{id}/download-project-plan")]
        public async Task<IActionResult> DownloadProjectPlan(int id)
        {
            var meeting = await _db.Meetings.FindAsync(id);
            if (meeting == null || string.IsNullOrWhiteSpace(meeting.ProjectPlan))
                return NotFound("Project plan not found");

            var bytes = Encoding.UTF8.GetBytes(meeting.ProjectPlan);
            var fileName = $"{meeting.Title?.Replace(" ", "_") ?? "project"}_plan.md";

            return File(bytes, "text/markdown", fileName);
        }
    }

    public record SaveMeetingDto(
        string FirefliesId,
        string Title,
        DateTime? MeetingDate,
        double DurationSeconds,
        string TranscriptJson,
        string Summary,
        string? BulletGist,
        string? ActionItems,
        string? Keywords,
        string? ExtendedSectionsJson,
        string? AudioUrl
    );

    public record UpdateSummaryDto(string Summary);
   public record UpdatePreferencesDto(JsonElement Preferences);
    public record UpdateProjectPlanDto(string ProjectPlan);
}
