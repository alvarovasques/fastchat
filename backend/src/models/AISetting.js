import Sequelize, { Model } from "sequelize";

class AISetting extends Model {
  static init(sequelize) {
    super.init(
      {
        apiKey: {
          type: Sequelize.TEXT,
          allowNull: false
        }
      },
      {
        sequelize
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Company, { foreignKey: "companyId", as: "company" });
  }
}

export default AISetting;