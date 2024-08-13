const express = require('express');
const manufacturerController = require('../controllers/autopart_manufacturer');
const router = express.Router();

router.get('/manufacturers', manufacturerController.getAllManufacturers);
router.get('/manufacturer/:country?/:id?/:abbreviation?', manufacturerController.getManufacturerByParams);
// http://localhost:3000/api/manufacturer?country=Japan&id=10

router.delete('/manufacturer/delete/:deleteParams', manufacturerController.deleteManufacturerById);
router.post('/manufacturer/add', manufacturerController.addManufacturer);
router.put('/manufacturer/update/:id', manufacturerController.updateManufacturer);

module.exports = router;