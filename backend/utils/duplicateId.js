const db = require("../services/database");
const handleDuplicateId = async (tbname, sequenceId) => {
  try {
    const maxIdQuery = await db.pool.query(
      `SELECT MAX(id) AS max_id FROM autopart.${tbname}`
    );
    const maxId = maxIdQuery.rows[0].max_id;
    const freeIdQuery = await db.pool.query(
      `SELECT id FROM generate_series(10, ${maxId}, 10) AS id WHERE id NOT IN (SELECT id FROM autopart.${tbname}) LIMIT 1`
    );
    let freeId = undefined;
    if (freeIdQuery.rows.length > 0) {
      freeId = freeIdQuery.rows[0].id;
      console.log("Free ID found:", freeId);
    }
    if (freeId === undefined) {
      await db.pool.query(
        `ALTER SEQUENCE autopart."${sequenceId}" RESTART WITH ${maxId + 10};`
      );
    } else {
      await db.pool.query(
        `ALTER SEQUENCE autopart."${sequenceId}" RESTART WITH ${freeId};`
      );
    }
  } catch (error) {
    console.error({
      error: error.message,
      message: "Failed to handle duplicate ID",
    });
  }
};

exports.handleDuplicateId = handleDuplicateId;

const resetSequence = async (tbname, sequenceId) => {
  try {
    const maxIdQuery = await db.pool.query(
      `SELECT MAX(id) AS max_id FROM autopart.${tbname}`
    );
    const maxId = maxIdQuery.rows[0].max_id;
    await db.pool.query(
      `ALTER SEQUENCE autopart."${sequenceId}" RESTART WITH ${maxId + 10};`
    );
  } catch (error) {
    console.error({
      error: error.message,
      message: "Failed to reset sequence",
    });
  }
}

exports.resetSequence = resetSequence;