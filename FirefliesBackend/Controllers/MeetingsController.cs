
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
        //private readonly IFirefliesClient _ff;
    
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        // Constructor injection for dependencies
        public MeetingsController(AppDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }
        // Endpoint to get all meetings
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

        // Endpoint to get a meeting by ID
        // Endpoint to download meeting summary as text file

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



        // Endpoint to upsert a meeting
        // This will create a new meeting or update an existing one based on FirefliesId

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


                // Ensure MeetingDate is always UTC
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


        // Endpoint to save transcript from Fireflies
        
           [HttpPut("{id}/summary")]
        public async Task<IActionResult> UpdateSummary(int id, [FromBody] UpdateSummaryDto dto)
        {
            var m = await _db.Meetings.FindAsync(id);
            if (m == null) return NotFound();
            m.UserEditedSummary = dto.Summary; 
            await _db.SaveChangesAsync();
            return NoContent();
        }


        // Endpoint to save meeting preferences
        // This will update the summary preferences for a meeting
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

        // Endpoint to save transcript from Fireflies
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

        
        // Endpoint to generate files from summary
        // This will call the OpenAI API to generate files based on the meeting summary
        // It will return the generated files as a JSON array
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


        // Endpoint to get generated files for a meeting
        // This will return the files generated from the meeting summary
        // If no files were generated, it will return the default empty files
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


        // Endpoint to update files for a meeting
        // This will save the files generated from the meeting summary
        // It will update the FunctionalDoc, Mockups, and Markdown properties of the meeting
        // It will also update the GeneratedFilesJson property with the new files
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


        // Endpoint to generate a project plan based on the meeting files
        // This will call the OpenAI API to generate a project plan based on the FunctionalDoc, Mockups, and Markdown files
        // It will return the generated project plan as a JSON object  
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


        // Endpoint to get the project plan for a meeting
        // This will return the project plan generated from the meeting files
        // If no project plan was generated, it will return a 404 Not Found
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


        // Endpoint to update the project plan for a meeting

        [HttpPut("{id}/project-plan")]
        public async Task<IActionResult> UpdateProjectPlan(int id, [FromBody] UpdateProjectPlanDto dto)
        {
            var meeting = await _db.Meetings.FindAsync(id);
            if (meeting == null) return NotFound();

            meeting.ProjectPlan = dto.ProjectPlan ?? meeting.ProjectPlan;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Project plan updated." });
        }


        // Endpoint to download project plan as a markdown file
        // This will return the project plan as a markdown file for download
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

        // Endpoint to generate a product backlog based on the project plan
[HttpPost("{id}/generate-backlog")]
public async Task<IActionResult> GenerateBacklog(int id)
{
    var meeting = await _db.Meetings.FindAsync(id);
    if (meeting == null)
        return NotFound("Meeting not found.");

    // Check if project plan exists
    if (string.IsNullOrWhiteSpace(meeting.ProjectPlan))
        return BadRequest("No project plan found. Please generate a project plan first.");

    // Prevent regeneration if backlog already exists
    if (!string.IsNullOrWhiteSpace(meeting.Backlog))
    {
        return BadRequest("Product backlog already exists. You cannot generate it again.");
    }

    var apiKey = _configuration["OpenAI:ApiKey"];
    if (string.IsNullOrWhiteSpace(apiKey))
        return StatusCode(500, "OpenAI API key not configured.");

    try
    {
        var client = _httpClientFactory.CreateClient("OpenAI");

        var backlog = await BacklogService.GenerateBacklogFromProjectPlan(
            client,
            meeting.ProjectPlan,
            apiKey
        );

        meeting.Backlog = backlog;
        meeting.BacklogGeneratedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new BacklogResponse
        {
            MeetingId = id,
            Backlog = backlog,
            GeneratedAt = meeting.BacklogGeneratedAt.Value
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Generate backlog failed: {ex}");
        return StatusCode(500, "Failed to generate product backlog.");
    }
}

// Endpoint to get the backlog for a meeting
[HttpGet("{id}/backlog")]
public async Task<IActionResult> GetBacklog(int id)
{
    var meeting = await _db.Meetings.FindAsync(id);
    if (meeting == null) return NotFound();

    if (string.IsNullOrWhiteSpace(meeting.Backlog))
        return NotFound("No product backlog found for this meeting.");

    return Ok(new BacklogResponse
    {
        MeetingId = id,
        MeetingTitle = meeting.Title,
        FirefliesId = meeting.FirefliesId,
        Backlog = meeting.Backlog,
        GeneratedAt = meeting.BacklogGeneratedAt ?? DateTime.MinValue
    });
}

// Endpoint to update the backlog for a meeting
[HttpPut("{id}/backlog")]
public async Task<IActionResult> UpdateBacklog(int id, [FromBody] UpdateBacklogDto dto)
{
    var meeting = await _db.Meetings.FindAsync(id);
    if (meeting == null) return NotFound();

    meeting.Backlog = dto.Backlog ?? meeting.Backlog;
    await _db.SaveChangesAsync();

    return Ok(new { message = "Product backlog updated." });
}

// Endpoint to download backlog as a markdown file
[HttpGet("{id}/download-backlog")]
public async Task<IActionResult> DownloadBacklog(int id)
{
    var meeting = await _db.Meetings.FindAsync(id);
    if (meeting == null || string.IsNullOrWhiteSpace(meeting.Backlog))
        return NotFound("Product backlog not found");

    var bytes = Encoding.UTF8.GetBytes(meeting.Backlog);
    var fileName = $"{meeting.Title?.Replace(" ", "_") ?? "product"}_backlog.md";

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
    public record BacklogResponse
{
    public int MeetingId { get; set; }
    public string? MeetingTitle { get; set; }
    public string? FirefliesId { get; set; }
    public string Backlog { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
}
    // DTO for updating summary
    public record UpdateSummaryDto(string Summary);
    // DTO for updating preferences
   public record UpdatePreferencesDto(JsonElement Preferences);
   // DTO for updating project plan
    public record UpdateProjectPlanDto(string ProjectPlan);
    
    public record UpdateBacklogDto(string Backlog);
}
