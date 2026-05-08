const { Category, Product } = require("../model");

exports.getAllCategories  = async (req, res) => {
    try {

        const rows = await Category.findAll();

        res.status(200).json({
            message: 'get data from categories successfully.',
            total_categories : rows.length,
            list: rows
        })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id,{
            include: [{model:Product, attributes:['product_id', 'name', 'price']}]
        });

        if(!category) return res.status(404).json({message: 'Category not found!'});

        res.status(200).json({
            message: `Category have been found.`,
            list: category
        })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
exports.createCategory = async (req, res) => {
    try {
        const {category_name} = req.body;
        if(!category_name)  return res.status(400).json({message:'Category name is required.'});
        const category = await Category.create({category_name});
        res.status(201).json({message:'category name added successfully.', list: category})
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
exports.updateCategory = async(req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        const {category_name} = req.body;
        if(!category) return res.status(404).json({message:'category not found!'});
        await category.update({category_name});
        res.status(200).json({message:'category updated successfully.', list:category});
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    
    }
}
exports.removeCategory = async(req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if(!category) return res.status(404).json({message:'category not found!'});
        const productCount = await Product.count({where:{category_id : req.params.id}});
        if(productCount > 0){
            return res.status(400).json({message:'Cannot delete category with existing products'});
        }
        const deleted = await category.destroy();
        res.status(200).json({message : 'category have been deleted successfully.', list: deleted})
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}