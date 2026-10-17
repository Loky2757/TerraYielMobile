const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors()); // Permite peticiones desde la web y la app
app.use(express.json());

// Conexión a tu PostgreSQL
const pool = new Pool({
  user: "tu_usuario",
  host: "localhost",
  database: "tu_base_datos",
  password: "tu_password",
  port: 5432,
});

// Endpoint para obtener las semillas
app.get("/api/semillas", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM semillas_mexico");
    res.json(rows); // Devuelve las semillas en formato JSON
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => console.log("API escuchando en puerto 3000"));
