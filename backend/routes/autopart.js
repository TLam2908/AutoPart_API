const express = require('express')
const autopartController = require('../controllers/autopart')
const router = express.Router()

router.get('/autoparts', autopartController.getAllAutoParts)
router.get('/autopart/oem_number/:oem_number', autopartController.getAutoPartByOemNumber)
router.delete('/autopart/delete/:id?/:oem_number?', autopartController.deleteAutoPart)
router.post('/autopart/add', autopartController.addAutoPart)
router.put('/autopart/update/:oem_number', autopartController.updateAutopart)

module.exports = router