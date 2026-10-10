import axios from "axios";

export const enableMfa = async (username: string): Promise<{ qrCodeBase64: string }> => {
  const { data } = await axios.post<{ qrCodeBase64: string }>(`/passport/mfa/enable/${username}`);
  return data;
};

export const disableMfa = async (username: string): Promise<string> => {
  const { data } = await axios.post<string>(`/passport/mfa/disable/${username}`);
  return data;
};

export const verifyMfaOtp = async (username: string, password: string, otp: number): Promise<any> => {
  const { data } = await axios.post(`/passport/verify-internal`, { username, password, otp });
  return data;
};
