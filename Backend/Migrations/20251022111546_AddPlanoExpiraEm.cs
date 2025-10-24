using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanoExpiraEm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InputArquivo",
                table: "GenerationRequests");

            migrationBuilder.DropColumn(
                name: "InputArquivoOriginal",
                table: "GenerationRequests");

            migrationBuilder.AddColumn<DateTime>(
                name: "PlanoExpiraEm",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "InputTexto",
                table: "GenerationRequests",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlanoExpiraEm",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "InputTexto",
                table: "GenerationRequests",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "InputArquivo",
                table: "GenerationRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InputArquivoOriginal",
                table: "GenerationRequests",
                type: "text",
                nullable: true);
        }
    }
}
