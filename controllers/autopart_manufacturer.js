const db = require("../services/database");
const { handleDuplicateId, resetSequence } = require("../utils/duplicateId");

// Get all manufacturers
exports.getAllManufacturers = async (req, res) => {
  try {
    const manufacturers = await db.pool.query(
      "SELECT * FROM autopart.autopart_manufacturer ORDER BY id ASC;"
    );
    return res.status(200).json({manufacturers: manufacturers.rows});
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get manufacturer by ID
exports.getManufacturerByParams = async (req, res) => {
  try {
    const { id, abbreviation, country } = req.query;
    console.log("Received request with params:", { id, abbreviation, country });

    if (!id && !abbreviation && !country) {
      console.log("Missing parameters");
      return res.status(400).json({
        error:
          "No parameters provided. Please provide ID, abbreviation or country",
      });
    }

    let query = "";
    let queryParams = [];

    if (country) {
      query =
        "SELECT * FROM autopart.autopart_manufacturer WHERE country ILIKE $1";
      queryParams.push(`${country}%`);
      if (id) {
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        query += " AND id = $2";
        queryParams.push(parseInt(id, 10));
      }
      if (abbreviation) {
        query += " AND abbreviation ILIKE $2";
        queryParams.push(`${abbreviation}%`);
      }
      query += " ORDER BY id ASC";
    } else if (id) {
      if (isNaN(id)) {
        console.log("Invalid ID format");
        return res.status(400).json({ error: "Invalid ID format" });
      }
      query =
        "SELECT * FROM autopart.autopart_manufacturer WHERE id = $1 ORDER BY id ASC";
      queryParams = [parseInt(id, 10)]; // Chuyển đổi id thành số nguyên
    } else if (abbreviation) {
      query =
        "SELECT * FROM autopart.autopart_manufacturer WHERE abbreviation ILIKE $1 ORDER BY id ASC";
      queryParams.push(`${abbreviation}%`);
    }

    console.log("Executing query:", query, queryParams);
    const manufacturer = await db.pool.query(query, queryParams);

    if (!manufacturer.rows.length) {
      console.log("Manufacturer not found");
      return res.status(404).json({ error: "Manufacturer not found" });
    }

    return res.status(200).json({ manufacturer_found: manufacturer.rows });
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Delete manufacturer by ID and abbreviation
exports.deleteManufacturerById = async (req, res) => {
  try {
    let { id, country, abbreviation } = req.query;

    if (!id && !country && !abbreviation) {
      return res.status(400).json({
        error:
          "No parameters provided. Please provide ID, abbreviation or country",
      });
    }
    
    let query = "";
    let queryParams = [];

    if (id) {
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      query =
        "DELETE FROM autopart.autopart_manufacturer WHERE id = $1 RETURNING *";
      queryParams = [parseInt(id, 10)];
    } else if (country) {
      query =
        "DELETE FROM autopart.autopart_manufacturer WHERE country ILIKE $1 RETURNING *";
      queryParams = [country];
    } else if (abbreviation) {
      query =
        "DELETE FROM autopart.autopart_manufacturer WHERE abbreviation = $1 RETURNING *";
      queryParams = [abbreviation]
    }

    const result = await db.pool.query(query, queryParams);
    const deletedId = result.rows[0].id;
    // Reset id sequence
    await db.pool.query(
      `ALTER SEQUENCE autopart."autopart_manufacturer_id_seq" RESTART WITH ${deletedId};`
    );

    return res
      .status(200)
      .json({ message: "Manufacturer deleted successfully", deletedId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Add manufacturer
exports.addManufacturer = async (req, res) => {
  const { manufacturers } = req.body;
  if (!manufacturers) {
    return res.status(400).json({error: "No manufacturer data provided"});
  }
  for (let i = 0; i < manufacturers.length; i++) {
    const { manufacturer_name, country, type_of_part, abbreviation } = manufacturers[i];
    try {
      console.log("Adding manufacturer:", { manufacturer_name, country, type_of_part, abbreviation });
      const existManufacturer = await db.pool.query(
        "SELECT EXISTS (SELECT * FROM autopart.autopart_manufacturer WHERE abbreviation = $1 AND manufacturer_name = $2)",
        [abbreviation, manufacturer_name]
      );

      if (existManufacturer.rows[0].exists) {
        // Nếu nhà sản xuất đã tồn tại, bỏ qua và tiếp tục với nhà sản xuất tiếp theo
        continue;
      }
      const result = await db.pool.query(
        "INSERT INTO autopart.autopart_manufacturer (manufacturer_name, country, type_of_part, abbreviation) VALUES ($1, $2, $3, $4) RETURNING *",
        [manufacturer_name, country, type_of_part, abbreviation]
      );
    } catch (error) {
      if (
        error.code === "23505" &&
        error.constraint === "autopart_manufacturer_pkey"
      ) {
        await handleDuplicateId(
          "autopart_manufacturer",
          "autopart_manufacturer_id_seq"
        );
        const result = await db.pool.query(
          "INSERT INTO autopart.autopart_manufacturer (manufacturer_name, country, type_of_part, abbreviation) VALUES ($1, $2, $3, $4) RETURNING *",
          [manufacturer_name, country, type_of_part, abbreviation]
        );
        if (result.rows.length === 0) {
          return res.status(500).json({ error: "Failed to add manufacturer" });
        } 
      } else {
        await resetSequence("autopart_manufacturer", "autopart_manufacturer_id_seq");
        return res.status(500).json({ error: error.message });
      }
    }
  }
  return res.status(201).json({ message: "Manufacturers added successfully" });
};

// Update manufacturer by ID
exports.updateManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Manufacturer ID is required" });
    } else {
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const updateFields = req.body;
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const updateQueries = [];
      const values = [];

      Object.keys(updateFields).forEach((field, index) => {
        // Add field to update query
        updateQueries.push(`${field} = $${index + 1}`);
        // Add field value to query params
        values.push(updateFields[field]);
      });

      const updateResult = await db.pool.query(
        `UPDATE autopart.autopart_manufacturer SET ${updateQueries.join(
          ", "
        )} WHERE id = ${id} RETURNING *`,
        values
      );

      return res.status(200).json({
        message: `Manufacturer ${id} updated successfully`,
        manufacturerUpdated: updateResult.rows[0],
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
