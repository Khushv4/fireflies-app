using System;

namespace FirefliesBackend.Models
{
    public class Meeting
    {
        public int Id { get; set; }
        public string FirefliesId { get; set; } = string.Empty;
        public string Title { get; set; }
        public DateTime? MeetingDate { get; set; }
        public int DurationSeconds { get; set; }
        public string TranscriptJson { get; set; }
        public string Summary { get; set; }
        public string SummaryFileContent { get; set; } = string.Empty;
        public string FunctionalDoc { get; set; } = string.Empty;
        public string Mockups { get; set; } = string.Empty;
        public string Markdown { get; set; } = string.Empty;
        public string GeneratedFilesJson { get; set; } = string.Empty;
        
        // New properties for project plan
        public string ProjectPlan { get; set; } = string.Empty;
        public int? ProjectDurationWeeks { get; set; }
        public string ProjectDetails { get; set; } = string.Empty;
        public DateTime? ProjectPlanGeneratedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}