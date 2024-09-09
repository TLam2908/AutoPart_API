const db = require('../services/database');
const { handleDuplicateId, resetSequence } = require('../utils/duplicateId');

exports.getAllVehicalModels = async (req, res) => {
    try {
        const vehicleModels = await db.pool.query('SELECT * FROM autopart.vehicle_model ORDER BY id ASC');
        return res.status(200).json({ vehicleModels: vehicleModels.rows});
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

// Get vehical model by ID
exports.getVehicleModelById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({error: 'Vehicle model ID is required'});
        } else {
            if (isNaN(id)) {
                return res.status(400).json({error: 'Invalid ID format'})
            } else {
                const vehicleModel = await db.pool.query('SELECT * FROM autopart.vehicle_model WHERE id = $1 ORDER BY id ASC', [parseInt(id, 10)]);
                if (vehicleModel.rows.length === 0) {
                    return res.status(404).json({error: `Vehicle model with ID ${id} not found`});
                }
                return res.status(200).json({message: `Vehicle model with ID ${id}`, vehicleModel: vehicleModel.rows[0]});
            }
        }
    } catch (error) {
        return res.status(500).json({error: error.message});
    }   
}

exports.getVehicleModelByQuery = async (req, res) => {
    try {
        const { make, model, year, trim, engine_type, transmission, drivetrain, msrf, fuel_type, seating, dimension, weight } = req.query;
        console.log(make, model, year, trim, engine_type, transmission, drivetrain, msrf, fuel_type, seating, dimension, weight);
        let query = 'SELECT * FROM autopart.vehicle_model WHERE 1=1 '
        const queryParams = [];
        let paramIndex = 1;

        if (make && make !== 'undefined') {
            query += `AND make ILIKE $${paramIndex++} `
            queryParams.push(`%${make}%`);
        }
        if (model && model !== 'undefined') {
            query += `AND model ILIKE $${paramIndex++} `
            queryParams.push(`%${model}%`);
        }
        if (year && year !== 'undefined') {
            query += `AND year ILIKE $${paramIndex++} `
            queryParams.push(`%${year}%`);
        }
        if (trim && trim !== 'undefined') {
            query += `AND trim ILIKE $${paramIndex++} `
            queryParams.push(`%${trim}%`);
        }
        if (engine_type && engine_type !== 'undefined') {
            query += `AND engine_type ILIKE $${paramIndex++} `
            queryParams.push(`%${engine_type}%`);
        }
        if (transmission && transmission !== 'undefined') {
            query += `AND transmission ILIKE $${paramIndex++} `
            queryParams.push(`%${transmission}%`);
        }
        if (drivetrain && drivetrain !== 'undefined') {
            query += `AND drivetrain ILIKE $${paramIndex++} `
            queryParams.push(`%${drivetrain}%`);
        }
        if (msrf && msrf !== 'undefined') {
            query += `AND msrf = $${paramIndex++} `
            queryParams.push(parseInt(msrf, 10));
        }
        if (fuel_type && fuel_type !== 'undefined') {
            query += `AND fuel_type ILIKE $${paramIndex++} `
            queryParams.push(`%${fuel_type}%`);
        }
        if (seating && seating !== 'undefined') {
            query += `AND seating_capacity = $${paramIndex++} `
            queryParams.push(parseInt(seating, 10));
        }
        if (dimension && dimension !== 'undefined') {
            query += `AND dimension ILIKE $${paramIndex++} `
            queryParams.push(`%${dimension}%`);
        }
        if (weight && weight !== 'undefined') {
            query += `AND weight = $${paramIndex++} `
            queryParams.push(parseInt(weight, 10));
        }
        if (queryParams.length === 0) {
            return res.status(400).json({error: 'No field provided for search'});
        }

        console.log(query, queryParams)

        const vehicleModel = await db.pool.query(query, queryParams);
        if (vehicleModel.rows.length === 0) {
            return res.status(404).json({error: 'Vehicle model not found'});    
        }

        return res.status(200).json({message: 'Vehicle model found', vehicleModel: vehicleModel.rows});

    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

exports.deleteVehicleModelById = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({error: "Vehicle model ID is required"})
        } else {
            if (isNaN(id)) {
                return res.status(400).json({error: "Invalid ID format"})
            } else {
                const vehicleModel = await db.pool.query("DELETE FROM autopart.vehicle_model WHERE id = $1 RETURNING *", [parseInt(id, 10)])
                if (vehicleModel.rows.length === 0) {
                    return res.status(404).json({error: `Vehicle model with ID: ${id} not found`})
                }

                await db.pool.query(`AlTER SEQUENCE autopart."vehicle_model_id_seq" RESTART WITH ${id};`);

                return res.status(200).json({message: `Vehicle model with ID: ${id} deleted`, vehicleModel: vehicleModel.rows[0]})
            }
        }
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
}

exports.addVehicleModel = async (req, res) => {
    const {vehicleModels} = req.body;
    if (!vehicleModels) {
        return res.status(400).json({error: 'Vehicle model data is required'})
    }
    for (let i = 0; i < vehicleModels.length; i++) {
        const {make, model, year, trim, engine_type, transmission, drivetrain, msrp, fuel_type, seating_capacity, dimensions, weight} = vehicleModels[i];
        console.log(make, model, year, trim, engine_type, transmission, drivetrain, msrp, fuel_type, seating_capacity, dimensions, weight);
        if (!make || !model || !year || !trim || !engine_type || !transmission || !drivetrain || !msrp || !fuel_type || !seating_capacity || !dimensions || !weight) {
            return res.status(400).json({error: 'All fields are required for vehicle model'});
        }
        try {
            const existVehicleModel = await db.pool.query(
                "SELECT EXISTS (SELECT * FROM autopart.vehicle_model WHERE make = $1 AND model = $2 AND year = $3 AND trim = $4)", [make, model, year, trim]
            )
            if (existVehicleModel.length > 0) {
                continue
            } else {
                const result = await db.pool.query(
                    "INSERT INTO autopart.vehicle_model (make, model, year, trim, engine_type, transmission, drivetrain, msrp, fuel_type, seating_capacity, dimensions, weight) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *",
                    [make, model, year, trim, engine_type, transmission, drivetrain, msrp, fuel_type, seating_capacity, dimensions, weight]
                )
            }
        } catch (error) {
            if (error.code === "23505" && error.constraint === "vehicle_model_pkey") {
                await handleDuplicateId('vehicle_model', 'vehicle_model_id_seq');
                const result = await db.pool.query(
                    "INSERT INTO autopart.vehicle_model (make, model, year, trim, engine_type, transmission, drivetrain, msrp, fuel_type, seating_capacity, dimensions, weight) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *",
                    [make, model, year, trim, engine_type, transmission, drivetrain, msrp, fuel_type, seating_capacity, dimensions, weight]
                )
                if (result.rows.length === 0) {
                    return res.status(500).json({error: 'Failed to add vehical model'})
                }
            } else {
                await resetSequence('vehicle_model', 'vehicle_model_id_seq');
                return res.status(500).json({error: error.message})
            }
        }
    }
    return res.status(201).json({message: 'Vehicle model added successfully'})
}

exports.updateVehicleModelById = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({error: "Vehicle model ID is required"})
        } else {
            if (isNaN(id)) {
                return res.status(400).json({error: "Invalid ID format"})   
            }
            const updateFields = req.body;
            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({error: "No fields provided for update"})
            }

            const updateQueries = []
            const values = []

            Object.keys(updateFields).forEach((field, index) => {
                updateQueries.push(`${field} = $${index + 1}`)
                values.push(updateFields[field])
            })

            const updateResult = await db.pool.query(
                `UPDATE autopart.vehicle_model SET ${updateQueries.join(',')} WHERE id = ${id} RETURNING *`, values
            )
            if (updateResult.rows.length === 0) {
                return res.status(400).json({error: "Failed to update vehicle model"})
            }
            return res.status(200).json({message: `Vehicle model with ID: ${id} updated successfully`, vehicleModel: updateResult.rows[0]})
        }
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
}