using System.Collections.Generic;

namespace FirefliesBackend.Models
{
    public class GenerateFilesRequest
    {
        public string Summary { get; set; }
    }

    public class SaveFilesRequest
    {
        public int MeetingId { get; set; }
        public List<FirefliesBackend.Models.FileResult> Files { get; set; }
    }
}
