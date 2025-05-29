import Sequelize, { Model } from "sequelize";

class AIAssistant extends Model {
  static init(sequelize) {
    super.init(
      {
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT
        },
        provider: {
          type: Sequelize.STRING,
          allowNull: false
        },
        apiKey: {
          type: Sequelize.TEXT
        },
        model: {
          type: Sequelize.STRING,
          allowNull: false
        },
        instructions: {
          type: Sequelize.TEXT
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
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

export default AIAssistant;