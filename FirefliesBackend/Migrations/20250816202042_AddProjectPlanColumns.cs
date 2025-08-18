using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FirefliesBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectPlanColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProjectDetails",
                table: "Meetings",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "ProjectDurationWeeks",
                table: "Meetings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProjectPlan",
                table: "Meetings",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ProjectPlanGeneratedAt",
                table: "Meetings",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProjectDetails",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "ProjectDurationWeeks",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "ProjectPlan",
                table: "Meetings");

            migrationBuilder.DropColumn(
                name: "ProjectPlanGeneratedAt",
                table: "Meetings");
        }
    }
}
