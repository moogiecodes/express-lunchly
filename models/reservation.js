/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this._customerId;
    this.customerId = customerId;
    this._numGuests;
    this.numGuests = numGuests;
    this._startAt;
    this.startAt = startAt;
    this.notes = notes;
  }

  set numGuests(val) {
    if (val < 1){
      throw new Error("invalid number of guests")
    }
    this._numGuests = val;
  }

  set startAt(date) {
    this._startAt = date;
  }

  set customerId(val) {
    if (this._customerId){
      throw new Error("unauthorized");
    }
    this._customerId = val;
  }

  /** get reservation by ID */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         customer_id AS "customerId",  
         num_guests AS "numGuests", 
         start_at AS "startAt", 
         notes AS "notes"
        FROM reservations WHERE id = $1`,
      [id]
    );

    const reservation = results.rows[0];

    if (reservation === undefined) {
      const err = new Error(`No such reservation: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Reservation(reservation);
  }


  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this._startAt).format('MMMM Do YYYY, h:mm a');
  }

  getformattedStartAt2() {
    return moment(this._startAt).format('YYYY-MM-DD hh:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** saves this reservation */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this._customerId, this._numGuests, this._startAt, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      console.log(this.notes)
      await db.query(
        `UPDATE reservations 
          SET customer_id=$1, num_guests=$2, start_at=$3, notes=$4
             WHERE id=$5`,
        [this._customerId, this._numGuests, this._startAt, this.notes, this.id]
      );
    }
  }

}


module.exports = Reservation;
