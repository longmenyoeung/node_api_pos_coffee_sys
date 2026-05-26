const { where } = require("sequelize");
const { Product, Category } = require("../model");
const cloudinary = require('../config/cloudinary');

exports.getAllProducts = async (req, res) => {
    try {
        const { category_id, is_active } = req.query;
        const where = {};
        
        if(category_id) where.category_id = category_id;
        if(is_active !== undefined ) where.is_active = is_active === 'true';
        
        const products = await Product.findAll({
            where,
            include: [{model:Category, attributes:['category_name']}]
        });

        res.status(200).json({
            message:'get all data from products successfully.',
            list: products
        })

    } catch (error) {
        res.status(500).json({message: 'Internal server error.', err: error.message});
    }
}

exports.getProductById = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findByPk(id)

        if(!product) return res.status(404).json({message:'product not found!'});

        res.status(200).json({
            message: 'product have been found.',
            list:product
        })
    } catch (error) {
        res.status(500).json({message: 'Internal server error.', err: error.message});
    }

}

exports.createProduct = async (req, res) => {
    try {
        console.log('req.file:', req.file);
        const { name, description, category_id, price, is_active } = req.body;
        if (!name || !category_id || price === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // req.file is automatically uploaded to Cloudinary by multer-storage-cloudinary
        const image_url = req.file ? req.file.path : null;   // Cloudinary returns the secure URL

        const product = await Product.create({
            name,
            description,
            category_id,
            price,
            is_active,
            image_url     
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const updateData = { ...req.body };
        if (req.file) {
            updateData.image_url = req.file.path; 
        }

        await product.update(updateData);
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.removeProduct = async (req, res) => {
    try {
        const productId  = req.params.id;
        const product = await Product.findByPk(productId);

        if(!product){return res.status(404).json({message:'Product id not found!'});}

        const deleted = await Product.destroy({where:{product_id:productId}});

        res.status(200).json({message:'Product deleted successfully.', id: deleted});

    } catch (error) {
        res.status(500).json({message: 'Internal server error.', err: error.message});       
    }
}