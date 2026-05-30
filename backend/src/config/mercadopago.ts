import MercadoPago, { Preference } from 'mercadopago';

const mpClient = new MercadoPago({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export { mpClient, Preference };