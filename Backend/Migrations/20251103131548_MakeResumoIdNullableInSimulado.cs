using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class MakeResumoIdNullableInSimulado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Simulados_Resumos_ResumoId",
                table: "Simulados");

            migrationBuilder.AlterColumn<int>(
                name: "ResumoId",
                table: "Simulados",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "GenerationRequestId",
                table: "Simulados",
                type: "integer",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Simulados_Resumos_ResumoId",
                table: "Simulados",
                column: "ResumoId",
                principalTable: "Resumos",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Simulados_Resumos_ResumoId",
                table: "Simulados");

            migrationBuilder.DropColumn(
                name: "GenerationRequestId",
                table: "Simulados");

            migrationBuilder.AlterColumn<int>(
                name: "ResumoId",
                table: "Simulados",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Simulados_Resumos_ResumoId",
                table: "Simulados",
                column: "ResumoId",
                principalTable: "Resumos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
