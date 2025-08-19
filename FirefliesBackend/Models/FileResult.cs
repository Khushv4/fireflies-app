namespace FirefliesBackend.Models
{
    // Represents a file result with its ID, name, and content
    // This class is used to store the files generated from a meeting summary
    public class FileResult
    {
        public int Id { get; set; } // DB Primary Key
        public string Name { get; set; }
        public string Content { get; set; }
    }
}
