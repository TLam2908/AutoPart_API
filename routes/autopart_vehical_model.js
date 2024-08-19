const express = require('express')
const vehicalModelController = require('../controllers/autopart_vehical_model')
const router = express.Router()

router.get('/vehicle_models', vehicalModelController.getAllVehicalModels)
router.get('/vehicle_model/id/:id', vehicalModelController.getVehicalModelById)
router.get('/vehicle_model/:make?/:model?/:year?/:trim?/:engine_type?/:transmission?/:drivetrain?/:msrf?/:fuel_type?/:seating?/:dimension?/:weight?', vehicalModelController.getVehicalModelByQuery) 
//URL: http://localhost:3000/vehical_model?make=Toyota&model=Corolla
//URL: http://localhost:3000/vehical_model?make=Toyota&year=2021&trim=LE
//URL: http://localhost:3000/vehical_model?model=Corolla&year=2021
//URL: http://localhost:3000/vehical_model?make=Toyota&model=Camry&engine_type=Hybrid  

router.post('/vehicle_model/add', vehicalModelController.addVehicalModel)
router.put('/vehicle_model/update/:id', vehicalModelController.updateVehicalModelById)
router.delete('/vehicle_model/delete/:id', vehicalModelController.deleteVehicalModelById)

module.exports = router