export const WA_CONFIG = {
  verifyToken: process.env.WA_VERIFY_TOKEN!,
  accessToken: process.env.WA_ACCESS_TOKEN!,
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID!,
  businessAccountId: process.env.WA_BUSINESS_ACCOUNT_ID!,
  apiVersion: 'v21.0',
  baseUrl: `https://graph.facebook.com/v21.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
};

export const APP_CONFIG = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  fare: {
    auto: {
      base: 700,
      digital: 560,
      permisionario: 560,
      comisionMunicipal: 140,
    },
    moto: {
      base: 300,
      digital: 240,
      permisionario: 240,
      comisionMunicipal: 60,
    },
    fraccionamientoMinutos: 15,
    toleranciaMinutos: 5,
    horaFraccionamientoInicio: 2,
  },
};