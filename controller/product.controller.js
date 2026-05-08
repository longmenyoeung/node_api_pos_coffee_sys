const { where } = require("sequelize");
const { Product, Category } = require("../model");

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
        const {name, description, category_id, price, is_active} = req.body;

        if(!name || !category_id || price == undefined){
            return res.status(400).json({message:'Please complete all the feilds.'});
        }

        const findCateId = await Category.findByPk(category_id);

        if(findCateId < 1) {
            return res.status(404).json({message:'category id not found, please create category first.'});
        }


        const product = await Product.create({name,description,category_id,price,is_active});

        res.status(201).json({
            message:'product added successfully',
            list: product
        });

    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            err:error.message
        })
    }
}

exports.updateProduct = async (req, res) => {
    try {
        const {name, description, category_id, price, is_active} = req.body;
        const productId = req.params.id;

        //1 find product in product table
        const product = await Product.findByPk(productId);
        if(!product){
            return res.status(404).json({
                message:'Product ID not found.'
            });
        }

        //2 find product in product table
        const category = await Category.findByPk(category_id);
        if(!category){
            return res.status(404).json({
                message:'The Category ID you provided does not exist.'
            });
        }

        // 3. Update the PRODUCT (not the category!)
            await Product.update({
            name, 
            description, 
            category_id, 
            price, 
            is_active
        },{where:{product_id:productId}}) // Tell Sequelize WHICH product to update


        res.status(200).json({
            message:'Product updated successfully',
            list : {
                name, 
                description, 
                category_id, 
                price, 
                is_active
            }
        })

    } catch (error) {
        res.status(500).json({message: 'Internal server error.', err: error.message});       
    }
}


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