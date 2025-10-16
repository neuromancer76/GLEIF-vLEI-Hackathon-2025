import * as signinResource from "@pages/background/resource/signin";
import { signifyService } from "@pages/background/services/signify";
import { getDomainFromUrl } from "@shared/utils";
import { IHandler, IIdentifier, ICredential } from "@config/types";
import { getCurrentUrl } from "@pages/background/utils";
import { sessionStorageService } from "@pages/background/services/browser-storage";
import { matchesCredentialSchema } from "@shared/credential-utils";



export async function handleFetchAutoSigninSignature({
  sendResponse,
  tabId,
  url,
  data,
}: IHandler) {
  // Validate that message comes from a page that has a signin
  const signins = await signinResource.getDomainSignins(url);
  const autoSignin = signins?.find((signin) => signin.autoSignin);
  if (!signins?.length || !autoSignin) {
    sendResponse({
      error: { code: 404, message: "auto signin not found" },
    });
    return;
  }

  try {
    const isig = await signifyService.authorizeSelectedSignin({
      tabId: tabId!,
      signin: autoSignin,
      origin: getDomainFromUrl(url!),
      config: { sessionOneTime: false }, // Default session config for auto signin
    });

    sendResponse({
      data: isig,
    });
  } catch (error: any) {
    sendResponse({
      error: { code: 503, message: error?.message },
    });
  }
}

export async function handleFetchSignifyHeaders({
  sendResponse,
  url,
  tabId,
  data,
}: IHandler) {
  try {
    // const signin = await signinResource.getDomainSigninByIssueeName(
    //   url!,
    //   aidName
    // );
    // if (!signin?.autoSignin) {
    //   sendResponse({
    //     data: {},
    //   });
    //   return;
    // }
    const isig = await signifyService.getSignedHeaders({
      origin: getDomainFromUrl(url!),
      rurl: data.url,
      method: data.method,
      headers: data.headers,
      tabId: tabId!,
      // signin,
    });
    sendResponse({
      data: isig,
    });
  } catch (error: any) {
    sendResponse({
      error: { code: 503, message: error?.message },
    });
  }
}

export async function handleFetchTabSignin({ sendResponse, url }: IHandler) {
  console.log("handleFetchTabSignin called with url:", url);
  try {
    const signins = await signinResource.getDomainSignins(url);
    const autoSigninObj = signins?.find((signin) => signin.autoSignin);
    sendResponse({ data: { signins: signins ?? [], autoSigninObj } });
  } catch (error: any) {
    sendResponse({
      error: { code: 503, message: error?.message },
    });
  }
}

export async function handleFetchIdentifiers({ sendResponse }: IHandler) {
  try {
    const identifiers = await signifyService.listIdentifiers();
    sendResponse({ data: { aids: identifiers ?? [] } });
  } catch (error: any) {
    sendResponse({
      error: { code: 503, message: error?.message },
    });
  }
}

export async function handleFetchSignins({ sendResponse, url }: IHandler) {
  const signins = await signinResource.getSignins();
  sendResponse({
    data: {
      signins,
    },
  });
}

export async function handleFetchCredentials({ sendResponse }: IHandler) {
  var credentials = await signifyService.listCredentials();
  console.log("--> Fetched credentials:", credentials);
  const indentifiers = await signifyService.listIdentifiers();
  // Add holder name to credential
  // Add CESR to credential
  credentials?.forEach(async (credential: ICredential) => {
    const issueePrefix = credential.sad.a.i;
    const aidIssuee = indentifiers.find((aid: IIdentifier) => {
      return aid.prefix === issueePrefix;
    });
    credential.issueeName = aidIssuee?.name!;
  });

  try {
    sendResponse({ data: { credentials: credentials ?? [] } });
  } catch (error: any) {
    sendResponse({
      error: { code: 503, message: error?.message },
    });
  }
}

export async function handleFetchCredential({ sendResponse, data }: IHandler) {
  const cred = await signifyService.getCredential(data.id, data.includeCESR);
  sendResponse({
    data: { credential: cred ?? null },
  });
}

export async function handleFetchCredentialRequests({ sendResponse, data }: IHandler) {
  console.log("handleFetchCredentialRequests called with data:", data);
  try {
    const result = await signifyService.getCredentialRequests();
    
    console.log("Fetched credential requests:", result);
    sendResponse({ data: result });
  } catch (error: any) {
    console.error("Error fetching credential requests:", error);
    sendResponse({ error: { code: 503, message: error?.message } });
  }
}

export async function handleApproveCredentialRequest({ sendResponse, data }: IHandler) {
  console.log("handleApproveCredentialRequest called with data:", data);
  try {
    const result = await signifyService.approveCredentialRequest(data.issueeAidPrefix, data.issuerOOBI, data.issuerAidPrefix, data.grantSaid, data.grantNotificationId);
    console.log("Approved credential request:", result);
    sendResponse({ data: result });
  } catch (error: any) {
    console.error("Error approving credential request:", error);
    sendResponse({ error: { code: 503, message: error?.message } });
  }
}

export async function handleCreateIdentifier({ sendResponse, data }: IHandler) {
  try {
    const resp = await signifyService.createAID(data.name);
    sendResponse({ data: { ...(resp ?? {}) } });
  } catch (error: any) {
    sendResponse({
      error: { code: 503, message: error?.message },
    });
  }
}

export async function handleCreateSignin({ sendResponse, data }: IHandler) {
  console.log("handleCreateSignin called with data:", data);
  var signins = await signinResource.getSignins();
  const currentUrl = await getCurrentUrl();
  const { identifier, credential } = data;
  let signinExists = false;
  if (identifier && identifier.prefix) {
    signinExists = Boolean(
      signins?.find(
        (signin) =>
          signin.domain === currentUrl?.origin &&
          signin?.identifier?.prefix === identifier.prefix
      )
    );
  }

  if (credential && credential.sad.d) {
    signinExists = Boolean(
      signins?.find(
        (signin) =>
          signin.domain === currentUrl?.origin &&
          signin?.credential?.sad?.d === credential.sad.d
      )
    );
  }

  // Enhanced schema-based filtering using the same logic as content script
  if (credential && credential.schema && (credential.schema.id || credential.schema.credentialType || credential.schema.title)) {
    const matchingSignins = signins?.filter((signin) =>
      signin.domain === currentUrl?.origin &&
      signin?.credential?.schema &&
      matchesCredentialSchema(credential.schema, signin.credential.schema));
    console.log("Matching signins based on schema:", matchingSignins);
    if (Boolean(matchingSignins.length)) {
      signins = matchingSignins;
      signinExists = true;
    }
  }

  if (signinExists) {
    sendResponse({ data: { signins: signins } });
  } else {
    const signinObj = signinResource.newSigninObject({
      identifier,
      credential,
      domain: currentUrl!.origin,
    });
    if (signins && signins?.length) {
      await signinResource.updateSignins([...signins, signinObj]);
    } else {
      await signinResource.updateSignins([signinObj]);
    }
    const storageSignins = await signinResource.getSignins();
    sendResponse({ data: { signins: storageSignins } });
  }
}

export async function handleCreateAttestationCredential({
  sendResponse,
  url,
  tabId,
  data,
}: IHandler) {
  try {
    const resp = await signifyService.createAttestationCredential({
      origin: getDomainFromUrl(url!),
      credData: data.credData,
      schemaSaid: data.schemaSaid,
      tabId: tabId!
    });
    sendResponse({
      data: { ...resp },
    });
  } catch (error: any) {
    sendResponse({
      error: { code: 503, message: error?.message },
    });
  }
}

export async function handleUpdateAutoSignin({ sendResponse, data }: IHandler) {
  const resp = await signinResource.updateDomainAutoSignin(data?.signin);
  sendResponse({
    data: {
      ...resp,
    },
  });
}

export async function handleDeleteSignin({ sendResponse, data }: IHandler) {
  const resp = await signinResource.deleteSigninById(data?.id);
  sendResponse({
    data: {
      ...resp,
    },
  });
}

export async function handleStoreCredentialSchemaRequirement({ sendResponse, data }: IHandler) {
  try {
    console.log("Storing credential schema requirement:", data);
    // Store the credential schema requirement in session storage
    await sessionStorageService.setValue("credentialSchemaRequirement", data.schema);
    await sessionStorageService.setValue("credentialTarget", data.target);
    sendResponse({
      data: { success: true },
    });
  } catch (error: any) {
    sendResponse({
      error: { code: 503, message: error?.message },
    });
  }
}

export async function handleFetchCredentialSchemaRequirement({ sendResponse }: IHandler) {
  try {
    // Retrieve the credential schema requirement from session storage
    const schema = await sessionStorageService.getValue("credentialSchemaRequirement");
    const target = await sessionStorageService.getValue("credentialTarget");
    sendResponse({
      data: { schema, target },
    });
  } catch (error: any) {
    sendResponse({
      error: { code: 503, message: error?.message },
    });
  }
}


