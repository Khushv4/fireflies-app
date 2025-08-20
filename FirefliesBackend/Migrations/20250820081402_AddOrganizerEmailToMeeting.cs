using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FirefliesBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizerEmailToMeeting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OrganizerEmail",
                table: "Meetings",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrganizerEmail",
                table: "Meetings");
        }
    }
}
