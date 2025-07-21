import axios from 'axios';
import { RELWORX } from '../config/env.js';

export async function requestPayment(opts) {
  const { reference, msisdn, currency, amount, description } = opts;
  const payload = {
    account_no: RELWORX.ACCOUNT_NO,
    reference,
    msisdn,
    currency,
    amount,
    description
  };
  const headers = {
    Authorization: `Bearer ${RELWORX.API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.relworx.v2'
  };
  return axios.post(`${RELWORX.BASE_URL}/mobile-money/request-payment`, payload, { headers });
}

export async function checkRequestStatus(reference) {
  const headers = {
    Authorization: `Bearer ${RELWORX.API_KEY}`,
    Accept: 'application/vnd.relworx.v2'
  };
  const url = `${RELWORX.BASE_URL}/mobile-money/check-request-status` + `?internal_reference=${reference}&account_no=${RELWORX.ACCOUNT_NO}`;
  return axios.get(url, { headers });
}
