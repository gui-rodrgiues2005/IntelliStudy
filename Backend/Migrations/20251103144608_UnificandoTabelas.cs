using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class UnificandoTabelas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Simulados_Materias_MateriaId",
                table: "Simulados");

            migrationBuilder.DropForeignKey(
                name: "FK_Simulados_Resumos_ResumoId",
                table: "Simulados");

            migrationBuilder.DropTable(
                name: "ConteudosGenericos");

            migrationBuilder.DropTable(
                name: "Resumos");

            migrationBuilder.DropTable(
                name: "Materias");

            migrationBuilder.DropIndex(
                name: "IX_Simulados_MateriaId",
                table: "Simulados");

            migrationBuilder.DropColumn(
                name: "MateriaId",
                table: "Simulados");

            migrationBuilder.RenameColumn(
                name: "ResumoId",
                table: "Simulados",
                newName: "ConteudoIAId");

            migrationBuilder.RenameIndex(
                name: "IX_Simulados_ResumoId",
                table: "Simulados",
                newName: "IX_Simulados_ConteudoIAId");

            migrationBuilder.CreateTable(
                name: "ConteudoIAs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    TopicoOriginal = table.Column<string>(type: "text", nullable: false),
                    TextoGerado = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConteudoIAs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConteudoIAs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConteudoIAs_UserId",
                table: "ConteudoIAs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Simulados_ConteudoIAs_ConteudoIAId",
                table: "Simulados",
                column: "ConteudoIAId",
                principalTable: "ConteudoIAs",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Simulados_ConteudoIAs_ConteudoIAId",
                table: "Simulados");

            migrationBuilder.DropTable(
                name: "ConteudoIAs");

            migrationBuilder.RenameColumn(
                name: "ConteudoIAId",
                table: "Simulados",
                newName: "ResumoId");

            migrationBuilder.RenameIndex(
                name: "IX_Simulados_ConteudoIAId",
                table: "Simulados",
                newName: "IX_Simulados_ResumoId");

            migrationBuilder.AddColumn<int>(
                name: "MateriaId",
                table: "Simulados",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConteudosGenericos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Texto = table.Column<string>(type: "text", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConteudosGenericos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Materias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Conteudo = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Titulo = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Materias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Materias_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Resumos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MateriaId = table.Column<int>(type: "integer", nullable: true),
                    ResumoTexto = table.Column<string>(type: "text", nullable: false),
                    TopicoOriginal = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Resumos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Resumos_Materias_MateriaId",
                        column: x => x.MateriaId,
                        principalTable: "Materias",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Resumos_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Simulados_MateriaId",
                table: "Simulados",
                column: "MateriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Materias_UserId",
                table: "Materias",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Resumos_MateriaId",
                table: "Resumos",
                column: "MateriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Resumos_UserId",
                table: "Resumos",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Simulados_Materias_MateriaId",
                table: "Simulados",
                column: "MateriaId",
                principalTable: "Materias",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Simulados_Resumos_ResumoId",
                table: "Simulados",
                column: "ResumoId",
                principalTable: "Resumos",
                principalColumn: "Id");
        }
    }
}
