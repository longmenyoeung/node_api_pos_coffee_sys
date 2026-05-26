const { Inventory } = require('../models');
const { Op } = require('sequelize');

exports.getAllInventory = async (req, res) => {
    try {
        const items = await Inventory.findAll();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLowStock = async (req, res) => {
    try {
        const threshold = parseFloat(req.params.threshold) || 10;
        const lowStock = await Inventory.findAll({ where: { stock_quantity: { [Op.lt]: threshold } } });
        res.json(lowStock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getInventoryById = async (req, res) => {
    try {
        const item = await Inventory.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Inventory item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createInventory = async (req, res) => {
    try {
        const { item_name, stock_quantity, unit_of_measure } = req.body;
        if (!item_name) return res.status(400).json({ error: 'item_name is required' });
        const item = await Inventory.create({ item_name, stock_quantity, unit_of_measure });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateInventory = async (req, res) => {
    try {
        const item = await Inventory.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Inventory item not found' });
        await item.update(req.body);
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteInventory = async (req, res) => {
    try {
        const item = await Inventory.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Inventory item not found' });
        await item.destroy();
        res.json({ message: 'Inventory item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};