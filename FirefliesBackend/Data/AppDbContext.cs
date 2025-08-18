using Microsoft.EntityFrameworkCore;
using FirefliesBackend.Models;

namespace FirefliesBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<Meeting> Meetings { get; set; }
    }
}
