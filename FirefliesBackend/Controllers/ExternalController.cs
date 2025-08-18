using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using FirefliesBackend.Services;
using System;
using System.Linq;
using FirefliesBackend.Data;
using FirefliesBackend.Models;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using Microsoft.Extensions.Configuration;

namespace FirefliesBackend.Controllers
{
    [ApiController]
    [Route("api/external")]
    public class ExternalController : ControllerBase
    {
        private readonly IFirefliesClient _ff;
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public ExternalController(IFirefliesClient ff, AppDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _ff = ff;
            _db = db;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpGet("meetings")]
        public async Task<IActionResult> GetMeetings(int limit = 25)
        {
            var query = @"query Transcripts($limit:Int){
              transcripts(limit:$limit){
                id title date duration summary { overview short_summary }
              }
            }";

            var doc = await _ff.QueryAsync(query, new { limit });

            if (!doc.RootElement.TryGetProperty("data", out var dataEl) || dataEl.ValueKind != JsonValueKind.Object ||
                !dataEl.TryGetProperty("transcripts", out var transcriptsEl) || transcriptsEl.ValueKind != JsonValueKind.Array)
            {
                return Ok(Array.Empty<object>());
            }

            var meetings = transcriptsEl.EnumerateArray()
                .Select(m =>
                {
                    DateTime? parsedDate = null;
                    if (m.TryGetProperty("date", out var d) && d.ValueKind != JsonValueKind.Null)
                    {
                        if (d.ValueKind == JsonValueKind.Number)
                        {
                            long unixTimestampMillis = d.GetInt64();
                            parsedDate = DateTimeOffset.FromUnixTimeMilliseconds(unixTimestampMillis).DateTime;
                        }
                        else if (d.ValueKind == JsonValueKind.String && DateTime.TryParse(d.GetString(), out DateTime dt))
                        {
                            parsedDate = dt;
                        }
                    }

                    return new
                    {
                        id = m.GetProperty("id").GetString() ?? "",
                        title = m.GetProperty("title").GetString() ?? "",
                        date = parsedDate,
                        duration = m.TryGetProperty("duration", out var durEl) && durEl.ValueKind != JsonValueKind.Null ? durEl.GetDouble() : 0,
                        summary = m.TryGetProperty("summary", out var summaryEl) && summaryEl.ValueKind == JsonValueKind.Object
                            ? summaryEl
                            : default(JsonElement)
                    };
                });

            return Ok(meetings);
        }

        [HttpGet("meetings/{id}")]
        public async Task<IActionResult> GetMeeting(string id)
        {
            var dbMeeting = await _db.Meetings.FirstOrDefaultAsync(m => m.FirefliesId == id);
            if (dbMeeting != null)
            {
                var mapped = new
                {
                    id = dbMeeting.FirefliesId,
                    title = dbMeeting.Title,
                    date = dbMeeting.MeetingDate,
                    duration = dbMeeting.DurationSeconds,
                    sentences = string.IsNullOrWhiteSpace(dbMeeting.TranscriptJson)
                                 ? Array.Empty<object>()
                                 : JsonSerializer.Deserialize<object[]>(dbMeeting.TranscriptJson),
                    summary = new
                    {
                        overview = dbMeeting.Summary,
                        short_summary = dbMeeting.Summary
                    }
                };
                return Ok(mapped);
            }

            var query = @"query Transcript($id:String!){
              transcript(id:$id){
                id title date duration sentences { index text start_time end_time speaker_name }
                summary { overview short_summary bullet_gist }
              }
            }";
            var doc = await _ff.QueryAsync(query, new { id });
            var transcriptEl = doc.RootElement.GetProperty("data").GetProperty("transcript");

            try
            {
                DateTime? meetingDate = null;
                if (transcriptEl.TryGetProperty("date", out var d) && d.ValueKind != JsonValueKind.Null)
                {
                    if (d.ValueKind == JsonValueKind.Number)
                    {
                        long unixTimestampMillis = d.GetInt64();
                        meetingDate = DateTimeOffset.FromUnixTimeMilliseconds(unixTimestampMillis).DateTime;
                    }
                    else if (d.ValueKind == JsonValueKind.String && DateTime.TryParse(d.GetString(), out DateTime dt))
                    {
                        meetingDate = dt;
                    }
                }

                var meeting = new Meeting
                {
                    FirefliesId = transcriptEl.GetProperty("id").GetString() ?? id,
                    Title = transcriptEl.GetProperty("title").GetString() ?? "",
                    MeetingDate = meetingDate,
                    DurationSeconds = transcriptEl.TryGetProperty("duration", out var durEl) && durEl.ValueKind != JsonValueKind.Null
                        ? Convert.ToInt32(Math.Round(durEl.GetDouble()))
                        : 0,
                    TranscriptJson = transcriptEl.TryGetProperty("sentences", out var sEl) && sEl.ValueKind == JsonValueKind.Array
                        ? sEl.GetRawText()
                        : "[]",
                    Summary = transcriptEl.TryGetProperty("summary", out var suEl) && suEl.TryGetProperty("overview", out var ovEl)
                        ? ovEl.GetString() ?? ""
                        : ""
                };

                _db.Meetings.Add(meeting);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed writing new meeting to DB: " + ex);
            }

            DateTime? mappedTranscriptDate = null;
            if (transcriptEl.TryGetProperty("date", out var dateProp) && dateProp.ValueKind != JsonValueKind.Null)
            {
                if (dateProp.ValueKind == JsonValueKind.Number)
                {
                    long unixTimestampMillis = dateProp.GetInt64();
                    mappedTranscriptDate = DateTimeOffset.FromUnixTimeMilliseconds(unixTimestampMillis).DateTime;
                }
                else if (dateProp.ValueKind == JsonValueKind.String && DateTime.TryParse(dateProp.GetString(), out DateTime dt))
                {
                    mappedTranscriptDate = dt;
                }
            }

            var mappedTranscript = new
            {
                id = transcriptEl.GetProperty("id").GetString() ?? "",
                title = transcriptEl.GetProperty("title").GetString() ?? "",
                date = mappedTranscriptDate,
                duration = transcriptEl.TryGetProperty("duration", out var durEl2) && durEl2.ValueKind != JsonValueKind.Null
                    ? durEl2.GetDouble()
                    : 0,
                sentences = transcriptEl.TryGetProperty("sentences", out var sEl2) && sEl2.ValueKind == JsonValueKind.Array
                    ? JsonSerializer.Deserialize<object[]>(sEl2.GetRawText())
                    : Array.Empty<object>(),
                summary = transcriptEl.TryGetProperty("summary", out var summaryEl) && summaryEl.ValueKind == JsonValueKind.Object
                    ? summaryEl
                    : default(JsonElement)
            };

            return Ok(mappedTranscript);
        }

        [HttpPost("generate-files")]
        public async Task<IActionResult> GenerateFiles([FromBody] GenerateFilesRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Summary))
                return BadRequest("Summary is required.");

            var apiKey = _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
                return StatusCode(500, "OpenAI API key not configured.");

            var client = _httpClientFactory.CreateClient("OpenAI");
            var files = await ChatGptService.GenerateFilesFromSummary(client, req.Summary, apiKey);
            return Ok(files);
        }

        [HttpPost("save-files")]
        public async Task<IActionResult> SaveFiles([FromBody] SaveFilesRequest req)
        {
            var meeting = await _db.Meetings.FirstOrDefaultAsync(m => m.Id == req.MeetingId);
            if (meeting == null) return NotFound();

            foreach (var file in req.Files)
            {
                var name = System.IO.Path.GetFileNameWithoutExtension(file.Name).ToLowerInvariant();
                if (name == "markdown")
                    meeting.Markdown = file.Content;
                else if (name == "functionaldoc")
                    meeting.FunctionalDoc = file.Content;
                else if (name == "mockups")
                    meeting.Mockups = file.Content;
            }

            meeting.GeneratedFilesJson = JsonSerializer.Serialize(req.Files);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}
