const db = require('../services/database');
const { handleDuplicateId, resetSequence } = require('../utils/duplicateId');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await db.pool.query('SELECT * FROM autopart.autopart_category ORDER BY id ASC');
        return res.status(200).json(categories.rows);
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

exports.getCategoryByParams = async (req, res) => {
    try {
        const { id, code } = req.query
        if (!id && !code) {
            return res.status(400).json({error: 'No parameters provided. Please provide ID or code'});
        }
        console.log(id, code)

        let query = ""
        let queryParams = []

        if (id) {
            if (isNaN(id)) {
                return res.status(400).json({error: 'Invalid ID format'});
            }
            query = "SELECT * FROM autopart.autopart_category WHERE id = $1 ORDER BY id ASC";
            queryParams = [parseInt(id, 10)];
        } else if (code) {
            query = "SELECT * FROM autopart.autopart_category WHERE category_code = $1 ORDER BY id ASC";
            queryParams = [code];    
        }

        const category = await db.pool.query(query, queryParams);
        if (category.rows.length === 0) {
            return res.status(404).json({error: `Category with ID ${id} not found`});
        }

        return res.status(200).json(category.rows);  
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

exports.deleteCategoryByParams = async (req, res) => {
    try {
        const { id, code } = req.query
        if (!id && !code) {
            return res.status(400).json({error: 'No parameters provided. Please provide ID or code'});
        }   
        let query = ""
        let queryParams = []
        console.log(id, code)
        if (id) {
            if (isNaN(id)) {
                return res.status(400).json({error: 'Invalid ID format'});
            } else {
                query = "DELETE FROM autopart.autopart_category WHERE id = $1 RETURNING *";
                queryParams.push(parseInt(id, 10)); 
            }
        } else if (code) {
            query = "DELETE FROM autopart.autopart_category WHERE category_code = $1 RETURNING *";
            queryParams.push(code)
        }

        const result = await db.pool.query(query, queryParams);
        const deletedId = result.rows[0].id;

        if (result.rows.length === 0) {
            return res.status(404).json({error: `Category with ID ${id} not found`});   
        }

        await db.pool.query(`ALTER SEQUENCE autopart."autopart_category_id_seq" RESTART WITH ${deletedId};`);
        return res.status(200).json({message: 'Category deleted successfully', deletedId});

    } catch (error) {
        return res.status(500).json({error: error.message})
    }
}

exports.addCategory = async (req, res) => {
    const { category_code, category_name, description } = req.body;
    if (!category_code || !category_name) {
        return res.status(400).json({error: 'Category code and name are required'});
    }
    try {
        const existCategory = await db.pool.query ("SELECT EXISTS (SELECT * FROM autopart.autopart_category WHERE category_code = $1 AND category_name = $2)", [category_code, category_name]);
        if (existCategory.rows[0].exists) {
            return res.status(400).json({error: `Category ${category_name} already exists`});
        }

        const result = await db.pool.query("INSERT INTO autopart.autopart_category (category_code, category_name, description) VALUES ($1, $2, $3) RETURNING *", [category_code, category_name, description]);
        return res.status(201).json(result.rows[0]);

    } catch (error) {
        if (error.code === '23505' && error.constraint === "autopart_category_pkey") {
            await handleDuplicateId('autopart_category', 'autopart_category_id_seq');
            const result = await db.pool.query("INSERT INTO autopart.autopart_category (category_code, category_name, description) VALUES ($1, $2, $3) RETURNING *", [category_code, category_name, description]);
            if (result.rows.length === 0) {
                return res.status(400).json({ error: "Failed to add category" });
            } else {
                return res.status(201).json({
                    message: "Category added successfully",
                    categoryAdded: result.rows[0],
                })
            }
        } else {
            await resetSequence('autopart_category', 'autopart_category_id_seq');
            return res.status(500).json({error: error.message});
        }
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) {
            return res.status(400).json({error: "Category ID is required"})
        } else {
            if (isNaN(id)) {
                return res.status(400).json({error: 'Invalid ID format'});
            }
            const updateFields = req.body
            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({error: "No fields to update"})
            }

            const updateQueries = []
            const values = []

            Object.keys(updateFields).forEach((field, index) => {
                updateQueries.push(`${field} = $${index + 1}`)
                values.push(updateFields[field])
            })

            const updateResult = await db.pool.query(`UPDATE autopart.autopart_category SET ${updateQueries.join(", ")} WHERE id = ${id} RETURNING *`, values)
            
            return res.status(200).json({
                message: "Category updated successfully",
                categoryUpdated: updateResult.rows[0]
            })
        }
     } catch (error) {
        return res.status(500).json({error: error.message})
     }
}