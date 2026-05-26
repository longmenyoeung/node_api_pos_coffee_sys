const express = require("express");
const { getAllCustomers, createCustomer, getCustomerById, updateCustomer } = require("../controller/customer.controller");
const router = express.Router();
const upload = require('../middlewares/uploadCloudinary');


router.get('/', getAllCustomers);
router.get('/:id',getCustomerById);

router.post('/', upload.single('image'), createCustomer);
router.put('/:id', upload.single('image'), updateCustomer);


module.exports = router