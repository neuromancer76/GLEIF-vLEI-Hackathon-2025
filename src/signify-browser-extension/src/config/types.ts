export interface ObjectOfArrays<T> {
  [key: string]: T[];
}

export interface ObjectOfObject<T> {
  [key: string]: T;
}

export interface IHandler {
  sendResponse: (response?: any) => void;
  tabId?: number;
  url?: string;
  data?: any;
}
export interface IMessage<T> {
  type: string;
  data?: T;
}

export interface IVendorData {
  title: string;
  logo?: string;
  icon?: string;
  onboardingUrl: string;
  docsUrl: string;
  supportUrl: string;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      error: string;
      heading: string;
      text: string;
      subtext: string;
      white: string;
      black: string;
      bodyBg: string;
      bodyBorder: string;
      bodyColor: string;
      cardColor: string;
      cardBg: string;
    };
  };
}

export interface ISignin {
  id: string;
  domain: string;
  identifier?: {
    name?: string;
    prefix?: string;
  };
  credential?: ICredential;
  credentialTarget?: string;
  createdAt: number;
  updatedAt: number;
  autoSignin?: boolean;
  expiry?: number;
}

export interface IIdentifier {
  name?: string;
  prefix: string;
}

export interface ICredential {
  issueeName: string;
  ancatc: string[];
  chains?: ICredential[];
  sad: { a: { i: string; [key: string]: any }; d: string };
  schema: {
    id?: string;
    title: string;
    credentialType: string;
    description: string;
  };
  status: {
    et: string;
  };
  cesr?: string;
  attributes?: Record<string, any>;  // Credential attributes/properties to display
}

export interface ISignature {
  headers: HeadersInit;
  credential?: ICredential;
  identifier?: {
    name?: string;
    prefix?: string;
  };
  autoSignin?: boolean;
}

export interface ISession {
  tabId: number;
  expiry: number;
  origin: string;
  aidName: string;
  signinId: string;
  // maxReq?: number;
  currentReq?: number;
}

export interface ISessionConfig {
  sessionOneTime: boolean;
}

export interface ICredentialRequest {
  id?: string;
  title: string;
  description: string;
  schemaId?: string;
  schema?: {
    id?: string;
  };
  credentialType?: string;
  values: Record<string, any>;
  issuerName?: string;
  issuerAidPrefix: string;
  issuerOOBI?: string;
  issueeAidPrefix?: string;
  grantSaid: string;
  grantNotificationId?: string;
  // Add the schema identifier from the ACDC
  schemaSaid?: string;  // This will come from grantExchange?.exn?.e.acdc?.s
}
