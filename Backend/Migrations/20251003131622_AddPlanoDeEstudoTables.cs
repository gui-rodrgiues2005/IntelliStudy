using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanoDeEstudoTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlanosDeEstudo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Meta = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanosDeEstudo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanosDeEstudo_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessoesDeEstudo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Topico = table.Column<string>(type: "text", nullable: false),
                    DiaDaSemana = table.Column<int>(type: "integer", nullable: false),
                    DuracaoMinutos = table.Column<int>(type: "integer", nullable: false),
                    Concluida = table.Column<bool>(type: "boolean", nullable: false),
                    PlanoDeEstudoId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessoesDeEstudo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessoesDeEstudo_PlanosDeEstudo_PlanoDeEstudoId",
                        column: x => x.PlanoDeEstudoId,
                        principalTable: "PlanosDeEstudo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlanosDeEstudo_UserId",
                table: "PlanosDeEstudo",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SessoesDeEstudo_PlanoDeEstudoId",
                table: "SessoesDeEstudo",
                column: "PlanoDeEstudoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SessoesDeEstudo");

            migrationBuilder.DropTable(
                name: "PlanosDeEstudo");
        }
    }
}
