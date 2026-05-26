const { Customer, Order } = require("../model");

exports.getAllCustomers = async (req, res) => {
    try {
        const rows = await Customer.findAll();

        res.status(200).json({
            message:'get data from customers successfully.',
            list:rows
        })

    } catch (error) {
        res.status(500).json({message:'Internal server error'});
    }
}

exports.getCustomerById = async (req, res) =>{
    try {
        const customerId = req.params.id;
        const customer = await Customer.findByPk(customerId, {
            include:[{model:Order, limit:10, order:[["timestamp", "DESC"]]}]
        })

        if(!customer){return res.status(404).json({message: "Customer ID not found."});}

        res.status(200).json({message:'Customer ID have been found.', list:customer});

    } catch (error) {
        res.status(500).json({message:'Internal server error'});
    }
}

exports.createCustomer = async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone, loyalty_points } = req.body;
        const image_url = req.file ? req.file.path : null;

        const customer = await Customer.create({
            first_name, last_name, email, password, phone, loyalty_points, image_url
        });
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const updateData = { ...req.body };
        
        if (req.file) {
            updateData.image_url = req.file.path;  
        }

        delete updateData.password;

        await customer.update(updateData);
        
        res.json({
            message: 'Customer updated successfully',
            customer
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeCustomer = async (req,res) => {
    try {
        const customerId = req.params.id;
        const customer = await Customer.findByPk(customerId)

        if(!customer){return res.status(404).json({message:'Customer not found.'});}

        await customer.destroy();
        
    } catch (error) {
        res.status(500).json({message:'Internal server error'})     
    }
}