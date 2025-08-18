namespace FirefliesBackend.Models
{
    public class GenerateProjectPlanRequest
    {
        public int DurationWeeks { get; set; }
        public string AdditionalDetails { get; set; } = string.Empty;
    }

    public class ProjectPlanResponse
    {
        public int MeetingId { get; set; }
        public string ProjectPlan { get; set; } = string.Empty;
        public int DurationWeeks { get; set; }
        public string AdditionalDetails { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
    }
}