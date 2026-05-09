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
        const {first_name, last_name, email,password, phone, royalty_points} = req.body;
        
        if(!first_name || !last_name || !email || !password){
            return res.status(400).json({
                message:'Messing to complet all the fields.'
            });
        }

        const customner = await Customer.create({
            first_name,
            last_name,
            email,
            password,
            phone,
            royalty_points
        })

        res.status(201).json({
            message:'added customer succesfully',
            list: customner
        })


    } catch (error) {
        res.status(500).json({message:'Internal server error'});
    }
}

exports.updateCustomer = async (req, res) => {
    try {
        const customerId = req.params.id;
        const customer = await Customer.findByPk(customerId);

        if(!customer){return res.status(404).json({message:'Customer ID not found.'});}

        await customer.update(req.body);

        res.status(200).json({
            message:'Customer updated successfully.',
            list: req.body
        })

    } catch (error) {
        res.status(500).json({message:'Internal server error'})
    }
}

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