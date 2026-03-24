using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddChatHistorico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MensagensHistorico");

            migrationBuilder.AddColumn<int>(
                name: "ConversaId",
                table: "GenerationRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ChatConversas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Tema = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatConversas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChatMensagens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConversaId = table.Column<int>(type: "integer", nullable: false),
                    User = table.Column<string>(type: "text", nullable: false),
                    Conteudo = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMensagens", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GenerationRequests_ConversaId",
                table: "GenerationRequests",
                column: "ConversaId");

            migrationBuilder.AddForeignKey(
                name: "FK_GenerationRequests_ChatConversas_ConversaId",
                table: "GenerationRequests",
                column: "ConversaId",
                principalTable: "ChatConversas",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GenerationRequests_ChatConversas_ConversaId",
                table: "GenerationRequests");

            migrationBuilder.DropTable(
                name: "ChatConversas");

            migrationBuilder.DropTable(
                name: "ChatMensagens");

            migrationBuilder.DropIndex(
                name: "IX_GenerationRequests_ConversaId",
                table: "GenerationRequests");

            migrationBuilder.DropColumn(
                name: "ConversaId",
                table: "GenerationRequests");

            migrationBuilder.CreateTable(
                name: "MensagensHistorico",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConteudoId = table.Column<int>(type: "integer", nullable: false),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Mensagem = table.Column<string>(type: "text", nullable: false),
                    Origem = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensagensHistorico", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MensagensHistorico_ConteudoIAs_ConteudoId",
                        column: x => x.ConteudoId,
                        principalTable: "ConteudoIAs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MensagensHistorico_ConteudoId",
                table: "MensagensHistorico",
                column: "ConteudoId");
        }
    }
}
