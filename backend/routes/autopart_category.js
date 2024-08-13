const express = require('express');
const categoryController = require('../controllers/autopart_category');
const router = express.Router();

router.get('/categories', categoryController.getAllCategories);
router.get('/category/:id?/:code?', categoryController.getCategoryByParams);

router.delete('/category/delete/:id?/:code?', categoryController.deleteCategoryByParams);
router.post('/category/add', categoryController.addCategory);
router.put('/category/update/:id', categoryController.updateCategory);

module.exports = router;


