const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ROLES = ['super_admin', 'manager', 'employee'];

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  mobile: { type: DataTypes.STRING(15), allowNull: false, unique: true },
  pinHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'employee' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  defaultScope: { attributes: { exclude: ['pinHash'] } },
  scopes: { withPin: { attributes: { include: ['pinHash'] } } },
});

const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
});

const Medicine = sequelize.define('Medicine', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Unit' },
  pack: { type: DataTypes.STRING },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  alertBelow: { type: DataTypes.INTEGER, defaultValue: 10 },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const Batch = sequelize.define('Batch', {
  batchNo: { type: DataTypes.STRING, allowNull: false },
  expiry: { type: DataTypes.DATEONLY, allowNull: false },
  qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  price: { type: DataTypes.DECIMAL(10, 2) },
  useFirst: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.ENUM('active', 'returned', 'disposed'), defaultValue: 'active' },
  note: { type: DataTypes.TEXT },
}, { indexes: [{ unique: true, fields: ['MedicineId', 'batchNo'] }] });

const Patient = sequelize.define('Patient', {
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING(15) },
});

// A visit = one trip to the inventory by an employee (one "Confirm pickup").
const Visit = sequelize.define('Visit', {
  note: { type: DataTypes.STRING },
});

const PickItem = sequelize.define('PickItem', {
  qty: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
});

// Stock received (manager adds) or adjusted.
const StockEntry = sequelize.define('StockEntry', {
  type: { type: DataTypes.ENUM('add', 'adjust', 'return', 'dispose'), defaultValue: 'add' },
  qty: { type: DataTypes.INTEGER, allowNull: false },
  note: { type: DataTypes.STRING },
});

Category.hasMany(Medicine); Medicine.belongsTo(Category);
Medicine.hasMany(Batch); Batch.belongsTo(Medicine);
User.hasMany(Visit); Visit.belongsTo(User);
Patient.hasMany(Visit); Visit.belongsTo(Patient);
Visit.hasMany(PickItem, { as: 'items' }); PickItem.belongsTo(Visit);
Batch.hasMany(PickItem); PickItem.belongsTo(Batch);
Medicine.hasMany(PickItem); PickItem.belongsTo(Medicine);
User.hasMany(StockEntry); StockEntry.belongsTo(User);
Batch.hasMany(StockEntry); StockEntry.belongsTo(Batch);

module.exports = { sequelize, ROLES, User, Category, Medicine, Batch, Patient, Visit, PickItem, StockEntry };
