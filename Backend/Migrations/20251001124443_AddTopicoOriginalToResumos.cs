using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTopicoOriginalToResumos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Resumos_Materias_MateriaId",
                table: "Resumos");

            migrationBuilder.DropForeignKey(
                name: "FK_Simulados_Materias_MateriaId",
                table: "Simulados");

            migrationBuilder.RenameColumn(
                name: "TopicosJson",
                table: "Resumos",
                newName: "TopicoOriginal");

            migrationBuilder.AlterColumn<int>(
                name: "MateriaId",
                table: "Simulados",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "ResumoId",
                table: "Simulados",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "MateriaId",
                table: "Resumos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Resumos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Simulados_ResumoId",
                table: "Simulados",
                column: "ResumoId");

            migrationBuilder.CreateIndex(
                name: "IX_Resumos_UserId",
                table: "Resumos",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Resumos_Materias_MateriaId",
                table: "Resumos",
                column: "MateriaId",
                principalTable: "Materias",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Resumos_Users_UserId",
                table: "Resumos",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

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
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Resumos_Materias_MateriaId",
                table: "Resumos");

            migrationBuilder.DropForeignKey(
                name: "FK_Resumos_Users_UserId",
                table: "Resumos");

            migrationBuilder.DropForeignKey(
                name: "FK_Simulados_Materias_MateriaId",
                table: "Simulados");

            migrationBuilder.DropForeignKey(
                name: "FK_Simulados_Resumos_ResumoId",
                table: "Simulados");

            migrationBuilder.DropIndex(
                name: "IX_Simulados_ResumoId",
                table: "Simulados");

            migrationBuilder.DropIndex(
                name: "IX_Resumos_UserId",
                table: "Resumos");

            migrationBuilder.DropColumn(
                name: "ResumoId",
                table: "Simulados");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Resumos");

            migrationBuilder.RenameColumn(
                name: "TopicoOriginal",
                table: "Resumos",
                newName: "TopicosJson");

            migrationBuilder.AlterColumn<int>(
                name: "MateriaId",
                table: "Simulados",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "MateriaId",
                table: "Resumos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Resumos_Materias_MateriaId",
                table: "Resumos",
                column: "MateriaId",
                principalTable: "Materias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Simulados_Materias_MateriaId",
                table: "Simulados",
                column: "MateriaId",
                principalTable: "Materias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
