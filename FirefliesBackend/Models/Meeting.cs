using System;

namespace FirefliesBackend.Models
{
    // Represents a meeting with various details including project plan information
    public class Meeting
    {
        public int Id { get; set; }
        public string FirefliesId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;// set default value to empty string, instead of null
        public DateTime? MeetingDate { get; set; }
        public int DurationSeconds { get; set; }
        public string TranscriptJson { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
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
         public string? BulletGist { get; set; }// can be null
        public string? ActionItems { get; set; }
        public string? Keywords { get; set; }
        public string? ExtendedSectionsJson { get; set; }
       public string? AudioUrl { get; set; }
         public string? SummaryPreferencesJson { get; set; }
         public string? UserEditedSummary { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string Backlog { get; set; } = string.Empty;
        public DateTime? BacklogGeneratedAt { get; set; }
    }
}