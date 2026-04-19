const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "BM6259#&",
  database: "flightdb"
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed");
    console.log(err);
  } else {
    console.log("Connected to MySQL");
  }
});

/* =========================
   SEARCH FLIGHTS
========================= */
app.get("/search", (req, res) => {
  const source = req.query.source?.trim();
  const destination = req.query.destination?.trim();

  const query = `
    SELECT * FROM Flights
    WHERE LOWER(TRIM(source)) = LOWER(?)
    AND LOWER(TRIM(destination)) = LOWER(?)
  `;

  db.query(query, [source, destination], (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});

/* =========================
   ALL FLIGHTS
========================= */
app.get("/flights", (req, res) => {
  db.query("SELECT * FROM Flights", (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});

/* =========================
   WAITING PASSENGERS
========================= */
app.get("/waiting", (req, res) => {
  const query = `
    SELECT p.name, b.flight_id
    FROM Bookings b
    JOIN Passengers p
    ON b.passenger_id = p.passenger_id
    WHERE b.status = 'Waiting'
  `;

  db.query(query, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});

/* =========================
   SEAT AVAILABILITY
========================= */
app.get("/seats", (req, res) => {
  const query = `
    SELECT f.flight_id,
    f.capacity - COUNT(b.booking_id) AS available_seats

    FROM Flights f

    LEFT JOIN Bookings b
    ON f.flight_id = b.flight_id
    AND b.status = 'Confirmed'

    GROUP BY f.flight_id, f.capacity
  `;

  db.query(query, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});

/* =========================
   BOOKING DETAILS
========================= */
app.get("/bookings", (req, res) => {
  const query = `
    SELECT b.booking_id,
           p.name,
           f.airline,
           b.status

    FROM Bookings b

    JOIN Passengers p
    ON b.passenger_id = p.passenger_id

    JOIN Flights f
    ON b.flight_id = f.flight_id
  `;

  db.query(query, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});

/* =========================
   REVENUE
========================= */
app.get("/revenue", (req, res) => {
  const query = `
    SELECT f.flight_id,
           SUM(pay.amount) AS revenue

    FROM Flights f

    JOIN Bookings b
    ON f.flight_id = b.flight_id

    JOIN Payments pay
    ON b.booking_id = pay.booking_id

    WHERE pay.payment_status = 'Paid'

    GROUP BY f.flight_id
  `;

  db.query(query, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});

/* =========================
   PENDING PAYMENTS
========================= */
app.get("/pending", (req, res) => {
  const query = `
    SELECT DISTINCT p.name

    FROM Payments pay

    JOIN Bookings b
    ON pay.booking_id = b.booking_id

    JOIN Passengers p
    ON b.passenger_id = p.passenger_id

    WHERE pay.payment_status = 'Pending'
  `;

  db.query(query, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.json(result);
    }
  });
});

/* =========================
   START SERVER
========================= */
app.listen(3000, () => {
  console.log("Server running on port 3000");
});