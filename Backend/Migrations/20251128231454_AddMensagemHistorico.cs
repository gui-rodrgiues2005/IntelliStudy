using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMensagemHistorico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MensagensChat");

            migrationBuilder.DropTable(
                name: "Chats");

            migrationBuilder.CreateTable(
                name: "MensagensHistorico",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConteudoId = table.Column<int>(type: "integer", nullable: false),
                    Origem = table.Column<string>(type: "text", nullable: false),
                    Mensagem = table.Column<string>(type: "text", nullable: false),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MensagensHistorico");

            migrationBuilder.CreateTable(
                name: "Chats",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ResumoId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Titulo = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chats_ConteudoIAs_ResumoId",
                        column: x => x.ResumoId,
                        principalTable: "ConteudoIAs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Chats_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MensagensChat",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChatId = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensagensChat", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MensagensChat_Chats_ChatId",
                        column: x => x.ChatId,
                        principalTable: "Chats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Chats_ResumoId",
                table: "Chats",
                column: "ResumoId");

            migrationBuilder.CreateIndex(
                name: "IX_Chats_UserId",
                table: "Chats",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MensagensChat_ChatId",
                table: "MensagensChat",
                column: "ChatId");
        }
    }
}
