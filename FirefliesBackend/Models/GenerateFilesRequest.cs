using System.Collections.Generic;

namespace FirefliesBackend.Models
{
    // Request to generate files based on a meeting summary
    public class GenerateFilesRequest
    {
        public string Summary { get; set; }
    }

    // Request to save generated files to a meeting
    public class SaveFilesRequest
    {
        public int MeetingId { get; set; }
        public List<FirefliesBackend.Models.FileResult> Files { get; set; }
    }
}
