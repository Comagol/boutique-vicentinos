export const authConfig = {
  password: {
    minLength: 8,
  },
  session: {
    timeout: 2 * 60 * 60 * 1000, // 2 horas
  },
};

export const bcryptConfig = {
  saltRounds: 10,
};