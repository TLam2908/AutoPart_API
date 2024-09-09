const db = require("../services/database");
const { handleDuplicateId, resetSequence } = require("../utils/duplicateId");

// Get all autoparts
exports.getAllAutoParts = async (req, res) => {
  try {
    const autoparts = await db.pool.query(
      "SELECT * FROM autopart.autopart ORDER BY id ASC"
    );

    if (autoparts.rows.length === 0) {
      return res.status(404).json({ error: "No autoparts found" });
    }

    return res.status(200).json({autoparts: autoparts.rows});
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get autopart by oem_number
exports.getAutoPartByOemNumber = async (req, res) => {
  try {
    const { oem_number } = req.params;
    if (!oem_number) {
      return res.status(400).json({ error: "Missing oem_number" });
    }

    const autopart = await db.pool.query(
      "SELECT * FROM autopart.autopart WHERE oem_number = $1",
      [oem_number]
    );

    if (autopart.rows.length === 0) {
      return res.status(404).json({ error: `Autopart with oem_number ${oem_number} not found` });
    }

    return res.status(200).json({ autopart_found: autopart.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteAutoPart = async (req, res) => {
  try {
    const { id, oem_number } = req.query;
    if (!id && !oem_number) {
      return res.status(400).json({ error: "Missing id or oem_number" });
    }
    const convert_oem_number = oem_number.toString();
    let query = "";
    let queryParams = [];

    if (id) {
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      } else {
        query = "DELETE FROM autopart.autopart WHERE id = $1 RETURNING *";
        queryParams.push(id);
      }
    } else if (convert_oem_number) {
      query = "DELETE FROM autopart.autopart WHERE oem_number = $1 RETURNING *";
      queryParams.push(convert_oem_number);
    }

    const deletedAutoPart = await db.pool.query(query, queryParams);
    const deletedId = deletedAutoPart.rows[0].id;

    // Reset id sequence
    await db.pool.query(
      `ALTER SEQUENCE autopart."autopart_id_seq" RESTART WITH ${deletedId}`
    );

    return res
      .status(200)
      .json({ message: "AutoPart deleted successfully", deletedId });
  } catch (error) {

    return res.status(500).json({ error: error.message });
  }
};

exports.addAutoPart = async (req, res) => {
  const { autoparts } = req.body;
  if (!autoparts) {
    return res.status(400).json({ error: "No autopart data provided" });
  }
  for (let i = 0; i < autoparts.length; i++) {
    const {
      part_name,
      description,
      oem_number,
      weight,
      manufacturer_id,
      category_code,
    } = autoparts[i];
    try {
      console.log("Adding part:", {part_name, description, oem_number, weight, manufacturer_id, category_code});
      const existAutoPart = await db.pool.query(
        "SELECT EXISTS (SELECT * FROM autopart.autopart WHERE oem_number = $1)",
        [oem_number]
      );

      if (existAutoPart.rows[0].exists) {
        continue;
      }

      const result = await db.pool.query(
        "INSERT INTO autopart.autopart (part_name, description, oem_number, weight, manufacturer_id, category_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          part_name,
          description,
          oem_number,
          weight,
          manufacturer_id,
          category_code,
        ]
      );
    } catch (error) {
      if (error.code === "23505" && error.constraint === "autopart_pkey") {
        await handleDuplicateId("autopart", "autopart_id_seq");
        const result = await db.pool.query(
          "INSERT INTO autopart.autopart (part_name, description, oem_number, weight, manufacturer_id, category_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [
            part_name,
            description,
            oem_number,
            weight,
            manufacturer_id,
            category_code,
          ]
        );
        if (result.rows.length === 0) {
          return res.status(500).json({ error: "Failed to add autopart" });
        }
      } else {
        await resetSequence("autopart", "autopart_id_seq");
        return res.status(500).json({ error: error.message });
      }
    }
  }
  return res.status(200).json({ message: "Autopart added successfully" });
};

exports.updateAutopart = async (req, res) => {
  try {
    const { oem_number } = req.params;
    if (!oem_number) {
      return res.status(400).json({ error: "Missing oem_number" });
    } else {
      const convert_oem_number = oem_number.toString();
      const updateFields = req.body;
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const updateQuery = [];
      const values = [];

      Object.keys(updateFields).forEach((field, index) => {
        updateQuery.push(`${field} = $${index + 1}`);
        values.push(updateFields[field]);
      });

      const updateResult = await db.pool.query(
        `
                UPDATE autopart.autopart SET ${updateQuery.join(
                  ", "
                )} WHERE oem_number = ${convert_oem_number} RETURNING *`,
        values
      );

      return res
        .status(200)
        .json({
          message: "Autopart updated successfully",
          autopartUpdated: updateResult.rows[0],
        });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
