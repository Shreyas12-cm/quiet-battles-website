
const express = require("express");
const router = express.Router();
const db = require("../db");
const adminMiddleware = require("../middleware/adminMiddleware");



//  SERIES APIs 

// Get all series
router.get("/series", (req, res) => {
  db.query("SELECT * FROM series ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add a series
router.post("/series", adminMiddleware,(req, res) => {
  const { title, slug, description, cover_image, status } = req.body;

  if (!title || !slug) {
    return res.status(400).json({ message: "Title and slug are required" });
  }

  const sql = `INSERT INTO series (title, slug, description, cover_image, status)
    VALUES (?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [title, slug, description || "", cover_image || "", status || "Draft"],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        message: "Series created successfully",
        id: result.insertId
      });
    }
  );
});

// Update a series
router.put("/series/:id", adminMiddleware,(req, res) => {
  const { title, slug, description, cover_image, status } = req.body;

  const sql = `UPDATE series SET title=?, slug=?, description=?, cover_image=?, status=?
    WHERE id=?`;

  db.query(
    sql,
    [title, slug, description || "", cover_image || "", status || "Draft", req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Series not found" });
      }
      res.json({ message: "Series updated successfully" });
    }
  );
});

// Delete a series
router.delete("/series/:id", adminMiddleware, (req, res) => {
  db.query("DELETE FROM series WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Series not found" });
    }
    res.json({ message: "Series deleted successfully" });
  });
});



// CHAPTER APIs 

// Get chapters belonging to a series
router.get("/series/:seriesId/chapters", (req, res) => {
  db.query(
    "SELECT * FROM chapters WHERE series_id=? ORDER BY chapter_number ASC",
    [req.params.seriesId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// Get one chapter
router.get("/chapters/:chapterId", (req, res) => {
  db.query(
    "SELECT * FROM chapters WHERE id=?",
    [req.params.chapterId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(results[0]);
    }
  );
});

// Add a chapter
router.post("/chapters", adminMiddleware, (req, res) => {
  const {
    series_id,
    chapter_number,
    title,
    slug,
    story_content,
    cover_image
  } = req.body;

  if (!series_id || !chapter_number || !title || !slug) {
    return res.status(400).json({
      message: "Series, chapter number, title and slug are required"
    });
  }

  const sql = `INSERT INTO chapters(series_id, chapter_number, title, slug, story_content, cover_image)
    VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [
      series_id,
      chapter_number,
      title,
      slug,
      story_content || "",
      cover_image || ""
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        message: "Chapter created successfully",
        id: result.insertId
      });
    }
  );
});

// Update a chapter
router.put("/chapters/:id", adminMiddleware,(req, res) => {
  const {
    series_id,
    chapter_number,
    title,
    slug,
    story_content,
    cover_image
  } = req.body;

  const sql = `
    UPDATE chapters
    SET series_id=?, chapter_number=?, title=?, slug=?,
        story_content=?, cover_image=?
    WHERE id=?
  `;

  db.query(
    sql,
    [
      series_id,
      chapter_number,
      title,
      slug,
      story_content || "",
      cover_image || "",
      req.params.id
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json({ message: "Chapter updated successfully" });
    }
  );
});

// Delete a chapter
router.delete("/chapters/:id", adminMiddleware, (req, res) => {
  db.query("DELETE FROM chapters WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Chapter not found" });
    }
    res.json({ message: "Chapter deleted successfully" });
  });
});



//  PRODUCT APIs 

// Add a product
router.post("/products", adminMiddleware, (req, res) => {
  const { name, description, price, image_url } = req.body;

  if (!name || price === undefined || Number(price) < 0) {
    return res.status(400).json({ message: "Valid product name and price are required" });
  }

  db.query(
    "INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)",
    [name, description || "", price, image_url || ""],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        message: "Product created successfully",
        id: result.insertId
      });
    }
  );
});

// Update a product
router.put("/products/:id", adminMiddleware,(req, res) => {
  const { name, description, price, image_url } = req.body;

  db.query(
    "UPDATE products SET name=?, description=?, price=?, image_url=? WHERE id=?",
    [name, description || "", price, image_url || "", req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.affectedRows) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product updated successfully" });
    }
  );
});

// Delete a product
router.delete("/products/:id", adminMiddleware,(req, res) => {
  db.query("DELETE FROM products WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  });
});



module.exports = router;
