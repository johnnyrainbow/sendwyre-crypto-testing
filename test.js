require('dotenv').config();
const axios = require('axios');
const testUrl = 'https://api.testwyre.com';
const productionUrl = 'https://api.sendwyre.com';
const WYRE_TEST_API_KEY = process.env.WYRE_TEST_API_KEY;
const CryptoJS = require('crypto-js');
const YOUR_SECRET_KEY = process.env.WYRE_SECRET_KEY;
// Example is assuming use of Express and Axios
// Make sure you are using the proper API keys for the correct environment (test, prod).
module.exports = {
	async cancelOrder(orderId) {
		try {
			const timestamp = new Date().getTime();
			const url = `${testUrl}/v3/orders/${orderId}/refund/partner?timestamp=${timestamp}`;
			const headers = {};
			const body = {};
			console.log(body);

			const details = JSON.stringify(body);
			headers['Content-Type'] = 'application/json';
			headers['X-Api-Key'] = WYRE_TEST_API_KEY;
			headers['X-Api-Signature'] = signature(url, details);
			const config = {
				method: 'POST',
				url: url,
				headers: headers,
				data: details,
			};
			const response = await axios(config);

			console.log('DATA!');
			console.log(response.data);
			this.pollGetOrder(orderId, 0);
		} catch (error) {
			console.log(error);
			// next(error);
		}
	},
	async pollGetOrder(orderId, attempts) {
		// orderId = 'WO_EJQFQE7B69';
		try {
			const timestamp = new Date().getTime();
			const url = `${testUrl}/v3/orders/${orderId}?timestamp=${timestamp}`;
			const headers = {};

			headers['Content-Type'] = 'application/json';
			headers['X-Api-Key'] = WYRE_TEST_API_KEY;
			const details = JSON.stringify({});
			headers['X-Api-Signature'] = getSignature(url);
			const config = {
				method: 'GET',
				url: url,
				headers: headers,
			};
			const response = await axios(config);

			console.log(response.data);
			// res.send(response.data);
			console.log('checking is authentication required for order');
			const self = this;
			console.log('attempts' + attempts);
			if (response.data.status === 'PROCESSING') {
				console.log('DONE ------------');
				return;
			}
			if (attempts === 5) {
				console.log('CANCELLING ORDER');
				// this.cancelOrder(orderId);
				return;
			}
			setTimeout(() => {
				self.pollGetOrder(orderId, ++attempts);
			}, 3000);
		} catch (error) {
			console.log('ERROR');
			console.log(error);
			// next(error);
		}
	},
	async getOrder(orderId, reservationId) {
		// orderId = 'WO_EJQFQE7B69';
		try {
			const timestamp = new Date().getTime();
			const url = `${testUrl}/v3/orders/${orderId}?timestamp=${timestamp}`;
			const headers = {};

			headers['Content-Type'] = 'application/json';
			headers['X-Api-Key'] = WYRE_TEST_API_KEY;
			const details = JSON.stringify({});
			headers['X-Api-Signature'] = getSignature(url);
			const config = {
				method: 'GET',
				url: url,
				headers: headers,
			};
			const response = await axios(config);

			console.log(response.data);
			// res.send(response.data);
			console.log('checking is authentication required for order');
			const self = this;
			setTimeout(() => {
				self.getOrderVerificationStatus(orderId, reservationId);
			}, 3000);
		} catch (error) {
			console.log('ERROR');
			console.log(error);
			// next(error);
		}
	},
	async getOrderVerificationStatus(orderId, reservationId) {
		try {
			const timestamp = new Date().getTime();
			const url = `${testUrl}/v3/debitcard/authorization/${orderId}?timestamp=${timestamp}`;
			const headers = {};

			headers['Content-Type'] = 'application/json';
			headers['X-Api-Key'] = WYRE_TEST_API_KEY;
			const details = JSON.stringify({});
			headers['X-Api-Signature'] = getSignature(url);
			const config = {
				method: 'GET',
				url: url,
				headers: headers,
			};
			const response = await axios(config);
			console.log('DATA!');
			console.log(response.data);
			// res.send(response.data);
			if (!response.data.smsNeeded && !response.data.card2faNeeded) {
				console.log('DONE! JUST POLL THIS ID ' + response.data.walletOrderId);
				this.pollGetOrder(response.data.walletOrderId, 0);
				return;
			}
			console.log('posting sms verification for order');
			let type;
			if (response.data.smsNeeded && response.data.card2faNeeded) {
				type = 'ALL';
			}
			if (response.data.smsNeeded) {
				type = 'SMS';
			}
			if (response.data.card2faNeeded) {
				type = 'CARD2FA';
			}
			this.postOrderVerification(
				type,
				response.data.walletOrderId,
				reservationId
			);
		} catch (error) {
			console.log('ERROR');
			console.log(error);
			// next(error);
		}
	},

	async postOrderVerification(
		type,
		walletOrderId,
		reservationId,
		sms,
		card2fa
	) {
		console.log(reservationId);
		try {
			const timestamp = new Date().getTime();
			const url = `${testUrl}/v3/debitcard/authorize/partner?timestamp=${timestamp}`;
			const headers = {};
			const body = {
				type,
				walletOrderId,
				reservationId,
				sms: '000000',
				card2fa: '000000',
			};
			console.log(body);

			const details = JSON.stringify(body);
			headers['Content-Type'] = 'application/json';
			headers['X-Api-Key'] = WYRE_TEST_API_KEY;
			headers['X-Api-Signature'] = signature(url, details);
			const config = {
				method: 'POST',
				url: url,
				headers: headers,
				data: details,
			};
			const response = await axios(config);

			console.log('DATA!');
			console.log(response.data);
			this.pollGetOrder(response.data.walletOrderId, 0);
		} catch (error) {
			console.log(error);
			// next(error);
		}
	},

	async postAuthorizeOrder(reservationId, orderId) {
		try {
			const timestamp = new Date().getTime();
			const url = `${testUrl}/v3/debitcard/process/partner?timestamp=${timestamp}`;
			const headers = {};
			const body = {
				debitCard: {
					number: '4111111111111111',
					year: '2023',
					month: '01',
					cvv: '123',
				},
				reservationId: reservationId,
				amount: '10',
				sourceCurrency: 'USD',
				destCurrency: 'BTC',
				dest: 'bitcoin:tb1q6yn0ajs733xsk25vefrhwjey4629qt9c67y6ma',
				referrerAccountId: 'AC_R3EHLVT3NUC',
				givenName: 'test',
				familyName: 'test',
				email: 'test.wyre@sendwyre.com',
				phone: '+64226781085',
				referenceId: 'your_business_id',
				address: {
					street1: 'Austin Street',
					city: 'Wellington',
					state: 'Wellington', // state code
					postalCode: '6011', // only numbers
					country: 'NZ', // alpha2 country code
				},
			};
			// const body = {
			// 	amount: 10,
			// 	paymentMethod: 'debit-card',
			// 	sourceCurrency: 'USD',
			// 	redirectUrl: 'https://www.sendwyre.com',
			// 	failureRedirectUrl: 'https://www.sendwyre.com',
			// 	referrerAccountId: 'AC_R3EHLVT3NUC',
			// 	country: 'US',
			// 	lockFields: ['amount'], GAB LOCK THIS!!! FORCE USER TO USE. ALSO LOCK ADDRESS (dest)
			// };
			const details = JSON.stringify(body);
			headers['Content-Type'] = 'application/json';
			headers['X-Api-Key'] = WYRE_TEST_API_KEY;
			headers['X-Api-Signature'] = signature(url, details);
			const config = {
				method: 'POST',
				url: url,
				headers: headers,
				data: details,
			};
			const response = await axios(config);
			console.log('DATA!');
			console.log(response.data);
			// res.send(response.data);
		} catch (error) {
			console.log('ERROR');
			console.log(error.response.data);
			// next(error);
		}
	},
	async placeOrder(reservationId) {
		try {
			const timestamp = new Date().getTime();
			const url = `${testUrl}/v3/debitcard/process/partner?timestamp=${timestamp}`;
			const headers = {};
			const body = {
				debitCard: {
					number: '4111111111111111',
					year: '2023',
					month: '01',
					cvv: '123',
				},
				reservationId: reservationId,
				amount: '10',
				sourceCurrency: 'USD',
				destCurrency: 'ETH',
				dest: 'ethereum:0x9E01E0E60dF079136a7a1d4ed97d709D5Fe3e341',
				referrerAccountId: 'AC_R3EHLVT3NUC',
				givenName: 'test',
				familyName: 'test',
				email: 'test.wyre@sendwyre.com',
				phone: '+64226781085',
				referenceId: 'your_business_id',
				address: {
					street1: 'Austin Street',
					city: 'Wellington',
					state: 'Wellington', // state code
					postalCode: '6011', // only numbers
					country: 'NZ', // alpha2 country code
				},
			};

			const details = JSON.stringify(body);
			headers['Content-Type'] = 'application/json';
			headers['X-Api-Key'] = WYRE_TEST_API_KEY;
			headers['X-Api-Signature'] = signature(url, details);
			const config = {
				method: 'POST',
				url: url,
				headers: headers,
				data: details,
			};
			const response = await axios(config);
			console.log('DATA!');
			console.log(response.data);
			// res.send(response.data);
			console.log('getting order');
			this.getOrder(response.data.id, reservationId);
		} catch (error) {
			console.log('ERROR');
			console.log(error.response.data);
			// next(error);
		}
	},
	async orderReservation(req, res, next) {
		try {
			const timestamp = new Date().getTime();
			const url = `${testUrl}/v3/orders/reserve?timestamp=${timestamp}`;
			const headers = {};
			const body = {
				amount: 10,
				paymentMethod: 'debit-card',
				sourceCurrency: 'USD',
				destCurrency: 'ETH',
				dest: 'ethereum:0x9E01E0E60dF079136a7a1d4ed97d709D5Fe3e341',
				redirectUrl: 'https://www.sendwyre.com',
				failureRedirectUrl: 'https://www.sendwyre.com',
				referrerAccountId: 'AC_R3EHLVT3NUC',
				country: 'NZ',
				lockFields: ['amount', 'sourceCurrency', 'destCurrency', 'dest'],
			};

			const details = JSON.stringify(body);
			headers['Content-Type'] = 'application/json';
			headers['X-Api-Key'] = WYRE_TEST_API_KEY;
			headers['X-Api-Signature'] = signature(url, details);
			const config = {
				method: 'POST',
				url: url,
				headers: headers,
				data: details,
			};
			const response = await axios(config);
			console.log('DATA!');
			console.log(response.data);
			console.log('placing order');
			this.placeOrder(response.data.reservation);
			// res.send(response.data);
		} catch (error) {
			console.log(error.response.data);
			// next(error);
		}
	},
};

const signature = (url, data) => {
	const dataToBeSigned = url + data;
	const token = CryptoJS.enc.Hex.stringify(
		CryptoJS.HmacSHA256(
			dataToBeSigned.toString(CryptoJS.enc.Utf8),
			YOUR_SECRET_KEY
		)
	);
	return token;
};
const getSignature = (url) => {
	const dataToBeSigned = url;
	const token = CryptoJS.enc.Hex.stringify(
		CryptoJS.HmacSHA256(
			dataToBeSigned.toString(CryptoJS.enc.Utf8),
			YOUR_SECRET_KEY
		)
	);
	return token;
};

//View signature example here: https://docs.sendwyre.com/docs/authentication#section-calculating-the-request-signature
