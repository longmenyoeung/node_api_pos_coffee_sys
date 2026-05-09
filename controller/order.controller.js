const { Order, sequelize, Product, Customer, Payment } = require("../model")


// Helper (can be placed in a service, but kept here for simplicity)
const createFullOrder = async (orderData) => {
    const {customer_id, items, payment_method, loyalty_points_to_use = 0} = orderData;
    const transaction = await sequelize.transaction();
    try {
        let total = 0;
        const orderItemData = [];
        for (const item of items){
            const product = await Product.findByPk(item.product_id, {transaction});
            if(!product){throw new Error(`Product ${item.product_id} not found.`)}
            const subtotal = product.price * item.quantity;
            total += subtotal;

            orderItemData.push({
                product_id: item.product_id,
                quantity: item.quantity,
                customization_points: item.customization_points || null,
                subtotal
            })
        }
        
        let finalTotal = total;
        let pointUsed = 0;

        if(loyalty_points_to_use > 0){
            const customer = await Customer.findByPk(customer_id, {transaction});
            if(!customer) throw new Error(`Customer not found.`);
            if(customer.loyalty_points >= loyalty_points_to_use){
                const discount = loyalty_points_to_use / 100;
                finalTotal = Math.max(0, total - discount);
                pointsUsed = loyalty_points_to_use;
            }else{
                throw new Error('Insufficient loyalty points');
            }
        }

        await Payment.create({
            order_id: order.order_id,
            payment_method,
            amount: finalTotal,
            timestamp: new Date()
        },{transaction});

        const customer = await Customer.findByPk(customer_id, { transaction });
        const pointsEarned = Math.floor(finalTotal);
        const newPoints = customer.loyalty_points - pointsUsed + pointsEarned;
        await customer.update({ loyalty_points: newPoints }, { transaction });

        await order.update({ status: 'Completed' }, { transaction });
        await transaction.commit();
        return order;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}











exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll();
        res.status(200).json({
            message:'get data from orders successfully.',
            list: orders
        })
    } catch (error) {
        res.status(500).json({message:'Internal server erroor', err:error.message})
    }
}