const express = require('express');
const app = express();
const port = 3000;
const test = require('./test');
app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
	test.orderReservation({ body: { referrerAccountId: 'AC_R3EHLVT3NUC' } });
});
