const express = require("express");
const { getAllCustomers, createCustomer, getCustomerById, updateCustomer } = require("../controller/customer.controller");
const router = express.Router();


router.get('/', getAllCustomers);
router.get('/:id',getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer)


module.exports = router