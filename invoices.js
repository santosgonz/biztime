const express = require("express");
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({ invoices: results.rows });
    } catch (e) {
        return next(e);
    }
});
router.get('/search', async (req, res, next) => {
    try {
        const { id } = req.query;
        const results = await db.query(`
            SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description 
            FROM invoices i
            JOIN companies c ON i.comp_code = c.code
            WHERE i.id = $1`, [id]);

        if (results.rows.length === 0) {
            throw new ExpressError(`Invoice not found with id of ${id}`, 404);
        }
        console.log(results)
        // Reformat the result to match the desired structure
        const firstrow = results.rows[0];

        const invoiceData = {
            
            // id: results.rows[0].id,
            amt: results.rows[0].amt,
            paid: results.rows[0].paid,
            add_date: results.rows[0].add_date,
            paid_date: results.rows[0].paid_date,
            company: {
                code: results.rows[0].code,
                name: results.rows[0].name,
                description: results.rows[0].description
            }
        };

        return res.json({ invoice: invoiceData });
    } catch (e) {
        return next(e);
    }
});


router.post('/', async (req, res, next) => {
    try {
        const { id, amt, paid, add_date, paid_date } = req.body;
        const results = await db.query(`INSERT INTO invoices (id, amt, paid, add_date, paid_date) VALUES ($1, $2, $3, $4, $5) RETURNING id, amt, paid, add_date, paid_date`, [id, amt, paid, add_date, paid_date])
        return res.status(201).json({ company: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})

router.put("/:id", async function (req, res, next) {
    try {
      let {amt, paid} = req.body;
      let id = req.params.id;
      let paidDate = null;
  
      const currResult = await db.query(
            `SELECT paid
             FROM invoices
             WHERE id = $1`,
          [id]);
  
      if (currResult.rows.length === 0) {
        throw new ExpressError(`No such invoice: ${id}`, 404);
      }
  
      const currPaidDate = currResult.rows[0].paid_date;
  
      if (!currPaidDate && paid) {
        paidDate = new Date();
      } else if (!paid) {
        paidDate = null
      } else {
        paidDate = currPaidDate;
      }
  
      const result = await db.query(
            `UPDATE invoices
             SET amt=$1, paid=$2, paid_date=$3
             WHERE id=$4
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
          [amt, paid, paidDate, id]);
  
      return res.json({"invoice": result.rows[0]});
    }
  
    catch (err) {
      return next(err);
    }
  
  });
  

  router.delete("/:id", async function (req, res, next) {
    try {
      let id = req.params.id;
  
      const result = await db.query(
            `DELETE FROM invoices
             WHERE id = $1
             RETURNING id`,
          [id]);
  
      if (result.rows.length === 0) {
        throw new ExpressError(`No such invoice: ${id}`, 404);
      }
  
      return res.json({"status": "deleted"});
    }
  
    catch (err) {
      return next(err);
    }
  });

module.exports = router;