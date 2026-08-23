export interface AuthUser {
  id: string;
  username: string;
  description: string;
  profile_id: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface SigninResponse {
  access_token: string;
}

export interface RecoveryResponse {
  message: string;
}
