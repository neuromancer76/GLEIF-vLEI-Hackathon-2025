import browser from "webextension-polyfill";
import * as signinResource from "@pages/background/resource/signin";
import {
  SignifyClient,
  Tier,
  ready,
  randomPasscode,
  Saider,
  Serder,
  IssueCredentialResult,
  CredentialData,
  Operation,
} from "signify-ts";
import { sendMessage } from "@src/shared/browser/runtime-utils";
import { sendMessageTab, getCurrentTab } from "@src/shared/browser/tabs-utils";
import { userService } from "@pages/background/services/user";
import { configService } from "@pages/background/services/config";
import { sessionService } from "@pages/background/services/session";
import { browserStorageService, sessionStorageService } from "@pages/background/services/browser-storage";
import { IIdentifier, ISignin, ISessionConfig, ICredential } from "@config/types";
import { SW_EVENTS } from "@config/event-types";
import { SESSION_ENUMS } from "@pages/background/services/session";
import {
  formatAsCredentialEdgeOrRuleObject,
  getSchemaFieldOfEdge,
  parseSchemaEdgeOrRuleSection,
  setNodeValueInEdge,
  waitOperation,
} from "@src/shared/signify-utils";

const PASSCODE_TIMEOUT = 5;
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds for operations
const DEFAULT_DELAY_MS = 5000; // 5 seconds for operations
const DEFAULT_RETRIES = 5;     // For retries
const IPEX_GRANT_ROUTE = '/exn/ipex/grant'
const IPEX_ADMIT_ROUTE = '/exn/ipex/admit'
const IPEX_APPLY_ROUTE = '/exn/ipex/apply'
const IPEX_OFFER_ROUTE = '/exn/ipex/offer'

const Signify = () => {
  let _client: SignifyClient | null;

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name == "passcode-timeout") {
      try {
        const response = await sendMessage({
          type: SW_EVENTS.check_popup_open,
        });
        if (response.data.isOpened) {
          console.log("Timer expired, but extension is open. Resetting timer.");
          resetTimeoutAlarm();
        }
      } catch (error) {
        console.log("Timer expired, client and passcode zeroed out");
        _client = null;
        await userService.removeControllerId();
        await userService.removePasscode();
      }
    }
  });

  const setTimeoutAlarm = () => {
    browser.alarms.create("passcode-timeout", {
      delayInMinutes: PASSCODE_TIMEOUT,
    });
  };

  const resetTimeoutAlarm = async () => {
    await browser.alarms.clear("passcode-timeout");
    setTimeoutAlarm();
  };

  const generatePasscode = () => {
    return randomPasscode();
  };

  const bootAndConnect = async (
    agentUrl: string,
    bootUrl: string,
    passcode: string
  ) => {
    try {
      await ready();
      _client = new SignifyClient(agentUrl, passcode, Tier.low, bootUrl);
      await _client.boot();
      await _client.connect();
      const state = await getState();
      await userService.setControllerId(state?.controller?.state?.i);
      setTimeoutAlarm();
    } catch (error) {
      console.error(error);
      _client = null;
      return { error };
    }
  };

  const connect = async (agentUrl: string, passcode: string) => {
    try {
      await ready();
      _client = new SignifyClient(agentUrl, passcode, Tier.low);
      await _client.connect();
      const state = await getState();
      await userService.setControllerId(state?.controller?.state?.i);
      setTimeoutAlarm();
    } catch (error) {
      console.error(error);
      _client = null;
      return { error };
    }
  };

  const isConnected = async () => {
    const passcode = await userService.getPasscode();
    const url = await configService.getAgentUrl();
    if (url && passcode && !_client) {
      await connect(url, passcode);
      await resetTimeoutAlarm();
    }

    try {
      // _client.state() did not throw exception, so connected agent is valid
      const state = await getState();
      console.log("Signify client is connected", _client);
      return _client && state?.controller?.state?.i ? true : false;
    } catch (error) {
      console.log(
        _client
          ? "Signify client is not valid, unable to connect"
          : "Signify client is not connected",
        _client
      );
      return false;
    }
  };

  const validateClient = () => {
    if (!_client) {
      throw new Error("Signify Client not connected");
    }
  };
  const getState = async () => {
    validateClient();
    return await _client?.state();
  };

  const listIdentifiers = async () => {
    validateClient();
    let aids: IIdentifier[] = [];
    let start = 0;
    let total = 0;
    do {
      const res = await _client?.identifiers().list(start);
      if (res.aids?.length === 0) {
        break;
      }

      aids.push(...res.aids);
      total = res.total;
      start = aids.length;
    } while (aids.length < total);
    return aids;
  };

  const listCredentials = async () => {
    validateClient();
    return await _client?.credentials().list();
  };

  // credential identifier => credential.sad.d
  const getCredential = async (
    credentialIdentifier: string,
    includeCESR: boolean = false
  ) => {
    validateClient();
    return await _client?.credentials().get(credentialIdentifier, includeCESR);
  };

  const disconnect = async () => {
    _client = null;
    await userService.removeControllerId();
    await userService.removePasscode();
  };

  /**
   * @param tabId - tabId of the tab from where the request is being made -- required
   * @param origin - origin url from where request is being made -- required
   * @param signin - signin object containing identifier or credential -- required
   * @param config - configuration object containing sessionTime and maxReq -- required
   * @returns Promise<Request> - returns a signed headers request object
   */
  const authorizeSelectedSignin = async ({
    tabId,
    signin,
    origin,
    config,
  }: {
    tabId: number;
    signin: ISignin;
    origin: string;
    config: ISessionConfig;
  }): Promise<any> => {
    let aidName = signin.identifier
      ? signin.identifier?.name
      : signin.credential?.issueeName;
    sessionStorageService.setValue("aidName", aidName || "");
    let credentialResp;
    if (signin.credential) {
      credentialResp = { raw: signin.credential, cesr: null };
      const cesr = await getCredential(signin.credential?.sad?.d, true);
      credentialResp.cesr = cesr;

      // Grant credential only if credentialTarget is set
      if (signin.credentialTarget) {
        await grantCredential(signin.credentialTarget, signin.credential.sad.d);
      } else {
        console.warn('No credentialTarget specified for credential granting');
      }
    }

    const response = {
      credential: credentialResp,
      identifier: signin?.identifier,
    };

    if (config?.sessionOneTime) {
      const sreq = await _client?.createSignedRequest(aidName!, origin, {});
      let jsonHeaders: { [key: string]: string } = {};
      if (sreq?.headers) {
        for (const pair of sreq.headers.entries()) {
          jsonHeaders[pair[0]] = pair[1];
        }
      }
      response.headers = jsonHeaders;
    } else {
      const sessionInfo = await sessionService.create({
        tabId,
        origin,
        aidName: aidName!,
        signinId: signin.id,
        config,
      });
      if (sessionInfo?.expiry) {
        response.expiry = sessionInfo.expiry;
      }

      await sendMessageTab(tabId, {
        type: "tab",
        subtype: "session-info",
        data: response,
      });
    }

    resetTimeoutAlarm();
    return response;
  };

  /**
   * @param tabId - tabId of the tab from where the request is being made -- required
   * @param origin - origin url from where request is being made -- required
   * @returns Promise<Request> - returns a signed headers request object
   */
  const getSessionInfo = async ({
    tabId,
    origin,
  }: {
    tabId: number;
    origin: string;
  }): Promise<any> => {
    const session = await sessionService.get({ tabId, origin });
    if (!session) {
      return null;
    }
    const signin = await signinResource.getDomainSigninById(
      origin,
      session.signinId
    );
    let credentialResp;
    if (signin?.credential) {
      credentialResp = { raw: signin.credential, cesr: null };
      const cesr = await getCredential(signin.credential?.sad?.d, true);
      credentialResp.cesr = cesr;
    }
    const resp = {
      credential: credentialResp,
      identifier: signin?.identifier,
      expiry: session.expiry,
    };
    await sendMessageTab(tabId, {
      type: "tab",
      subtype: "session-info",
      data: resp,
    });

    resetTimeoutAlarm();
    return resp;
  };

  /**
   * @param tabId - tabId of the tab from where the request is being made -- required
   * @param origin - origin url from where request is being made -- required
   * @returns Promise<Request> - returns null
   */
  const removeSessionInfo = async ({
    tabId,
    origin,
  }: {
    tabId: number;
    origin: string;
  }): Promise<any> => {
    await sessionService.remove(tabId);
    await sendMessageTab(tabId, {
      type: "tab",
      subtype: "session-info",
      data: null,
    });

    resetTimeoutAlarm();
  };

  /**
   * @param origin - origin url from where request is being made -- required
   * @param rurl - resource url that the request is being made to -- required
   * @param method - http method of the request -- default GET
   * @param headers - headers object of the request -- default empty
   * @param signin - signin object containing identifier or credential -- required
   * @returns Promise<Request> - returns a signed headers request object
   */
  const getSignedHeaders = async ({
    origin,
    rurl,
    method = "GET",
    headers = new Headers({}),
    tabId,
  }: {
    origin: string;
    rurl: string;
    method?: string;
    headers?: Headers;
    tabId: number;
  }): Promise<any> => {
    // in case the client is not connected, try to connect
    const connected = await isConnected();
    // connected is false, it means the client session timed out or disconnected by user
    if (!connected) {
      validateClient();
    }

    const session = await sessionService.get({ tabId, origin });
    await sessionService.incrementRequestCount(tabId);
    if (!session) {
      throw new Error("Session not found");
    }
    const sreq = await _client?.createSignedRequest(session.aidName, rurl, {
      method,
      headers,
    });
    resetTimeoutAlarm();
    console.log("sreq", sreq);
    let jsonHeaders: { [key: string]: string } = {};
    if (sreq?.headers) {
      for (const pair of sreq.headers.entries()) {
        jsonHeaders[pair[0]] = pair[1];
      }
    }

    return {
      headers: jsonHeaders,
    };
  };

  /**
   * Create a data attestation credential, it is an untargeted ACDC credential i.e. there is no issuee.
   *
   * @param origin - origin url from where request is being made -- required
   * @param credData - credential data object containing the credential attributes -- required
   * @param schemaSaid - SAID of the schema -- required
   * @param signin - signin object containing identifier or credential -- required
   * @returns Promise<Request> - returns a signed headers request object
   */
  const createAttestationCredential = async ({
    origin,
    credData,
    schemaSaid,
    tabId,
  }: {
    origin: string;
    credData: any;
    schemaSaid: string;
    tabId: number;
  }): Promise<any> => {
    // in case the client is not connected, try to connect
    const connected = await isConnected();
    // connected is false, it means the client session timed out or disconnected by user
    if (!connected) {
      validateClient();
    }

    const session = await sessionService.get({ tabId, origin });
    let { aid, registry, rules, edge } = await getCreateCredentialPrerequisites(
      session?.aidName!,
      schemaSaid
    );
    if (isGroupAid(aid) === true) {
      throw new Error(
        `Attestation credential issuance by multisig identifier ${session.aidName} is not supported yet!`
      );
    }

    let credArgs: CredentialData = {
      i: aid.prefix,
      ri: registry.regk,
      s: schemaSaid,
      a: credData,
      r: rules
        ? Object.keys(rules).length > 0
          ? Saider.saidify({ d: "", ...rules })[1]
          : undefined
        : undefined,
      e: edge
        ? Object.keys(edge).length > 0
          ? Saider.saidify({ d: "", ...edge })[1]
          : undefined
        : undefined,
    };
    console.log("create credential args: ", credArgs);
    let credResult = await createCredential(session.aidName, credArgs);
    if (credResult && _client) {
      await waitOperation(_client, credResult.op);
    }

    return credResult;
  };

  const getCreateCredentialPrerequisites = async (
    aidName: string,
    schemaSaid: string
  ): Promise<{
    aid: any | undefined;
    schema: any;
    registry: any;
    rules: any;
    edge: any;
  }> => {
    const aid = await _client?.identifiers().get(aidName);

    let registries = await _client?.registries().list(aidName);
    if (registries == undefined || registries.length === 0) {
      throw new Error(`No credential registries found for the AID ${aidName}`);
    }

    let schema = await _client?.schemas().get(schemaSaid);
    if (!schema || schema?.title == "404 Not Found") {
      throw new Error(`Schema not found!`);
    }

    const edgeObject = parseSchemaEdgeOrRuleSection(schema.properties?.e);
    let edge = formatAsCredentialEdgeOrRuleObject(edgeObject);
    let edgeSchema = getSchemaFieldOfEdge(edge);
    if (edge && edgeSchema) {
      let filter = { "-s": edgeSchema, "-a-i": aid?.prefix };
      let creds = await _client
        ?.credentials()
        .list({ filter: filter, limit: 50 });
      if (creds && creds?.length > 0) {
        edge = setNodeValueInEdge(edge, creds[0]?.sad.d);
      }
    }

    let parsedRules = parseSchemaEdgeOrRuleSection(schema.properties?.r);
    let rules = formatAsCredentialEdgeOrRuleObject(parsedRules);

    return { aid, schema, registry: registries[0], rules, edge };
  };

  const getControllerID = async (): Promise<string> => {
    validateClient();
    const controllerId = await userService.getControllerId();
    return controllerId;
  };

  const createAID = async (name: string) => {
    validateClient();
    let res = await _client?.identifiers().create(name);
    return await res?.op();
  };

  const createCredential = async (
    name: string,
    args: CredentialData
  ): Promise<IssueCredentialResult | undefined> => {
    const result = await _client?.credentials().issue(name, args);
    return result;
  };

  const isGroupAid = (aid: any): boolean => {
    return (
      aid.hasOwnProperty("group") &&
      typeof aid.group === "object" &&
      aid.group !== null
    );
  };

  const createTimestamp = () => {
    return new Date().toISOString().replace('Z', '000+00:00');
  }

  /**
 * Waits for and retrieves a specific notification.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} expectedRoute - The expected route in the notification attributes (e.g., IPEX_GRANT_ROUTE).
 * @param {number} [retries=DEFAULT_RETRIES] - Number of retry attempts.
 * @param {number} [delayMs=DEFAULT_DELAY_MS] - Delay between retries in milliseconds.
 * @returns {Promise<any>} The first matching unread notification.
 */
  const waitForAndGetNotification = async (
    client: SignifyClient,
    expectedRoute: string,
    retries: number = DEFAULT_RETRIES,
    delayMs: number = DEFAULT_DELAY_MS
  ): Promise<any> => {
    console.log(`Waiting for notification with route "${expectedRoute}"...`);
    let notifications = []

    // Retry loop to fetch notifications.
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // List notifications, filtering for unread IPEX_GRANT_ROUTE messages.
        let allNotifications = await client.notifications().list()
        console.log("Fetched notifications:", allNotifications);
        notifications = allNotifications.notes.filter(
          (n: any) => n.a.r === expectedRoute && n.r === false // n.r is 'read' status
        );
        if (notifications.length === 0) {
          throw new Error("Notification not found yet."); // Throw error to trigger retry
        }
        return notifications;
      }
      catch (error) {
        console.log(`[Retry] Grant notification not found on attempt #${attempt} of ${retries}`);
        if (attempt === retries) {
          console.error(`[Retry] Max retries (${retries}) reached for grant notification.`);
          break;
        }
        console.log(`[Retry] Waiting ${delayMs}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return notifications;
  }

  /**
 * Submits an IPEX grant for a credential.
 * @param {SignifyClient} client - The SignifyClient instance of the issuer.
 * @param {string} senderAidAlias - The alias of the AID granting the credential.
 * @param {string} recipientAidPrefix - The AID prefix of the recipient (holder).
 * @param {any} acdc - The ACDC (credential).
 * @returns {Promise<{ operation: Operation<any> }>} The operation details.
 */
  const ipexGrantCredential = async (
    client: SignifyClient,
    senderAidAlias: string,
    recipientAidPrefix: string,
    acdc: any
  ): Promise<{ operation: Operation<any> }> => {
    console.log(`AID "${senderAidAlias}" granting credential to AID "${recipientAidPrefix}" via IPEX...`);
    try {

      const [grant, gsigs, gend] = await client.ipex().grant({
        senderName: senderAidAlias,
        acdc: new Serder(acdc?.sad),
        iss: new Serder(acdc?.iss),
        anc: new Serder(acdc?.anc),
        ancAttachment: acdc.ancatc,
        recipient: recipientAidPrefix,
        datetime: createTimestamp(),
      });

      const submitGrantOperationDetails = await client
        .ipex()
        .submitGrant(senderAidAlias, grant, gsigs, gend, [recipientAidPrefix]);

      const completedOperation: any = await client
        .operations()
        .wait(submitGrantOperationDetails);

      if (completedOperation.error) {
        throw new Error(`IPEX grant submission failed: ${JSON.stringify(completedOperation.error)}`);
      }

      console.log(`Successfully submitted IPEX grant from "${senderAidAlias}" to "${recipientAidPrefix}".`);
      await client.operations().delete(completedOperation.name);
      return { operation: completedOperation };
    } catch (error) {
      console.error('Failed to submit IPEX grant:', error);
      throw error;
    }
  }

  // Grant a credential to a target identifier via IPEX
  const grantCredential = async (targetPrefix: string, credentialSaid: string) => {
    console.log('signify.grantCredential called with targetPrefix:', targetPrefix, 'credentialSaid:', credentialSaid);
    
    // Validate targetPrefix
    if (!targetPrefix || targetPrefix.trim() === '') {
      console.error('grantCredential: targetPrefix is empty or undefined');
      throw new Error('Target prefix is required for credential granting');
    }
    
    // in case the client is not connected, try to connect
    const connected = await isConnected();
    // connected is false, it means the client session timed out or disconnected by user
    if (!connected) {
      validateClient();
    }
    try {
      const credential = await _client?.credentials().get(credentialSaid);
      if (!credential) {
        console.log(`Credential with SAID ${credentialSaid} not found`);
      }
      else {
        const identifiers = await _client?.identifiers().list();
        console.log("Identifiers:", identifiers);
        console.log("agent pre:", _client?.agent?.pre);
        const issuerAlias = identifiers.aids.find((aid: any) => aid.prefix === credential?.sad?.a?.i)?.name;

        if (!issuerAlias) {
          console.log(`Issuer alias not found for prefix ${credential?.sad?.a?.i}`);
        }
        else {
          // Grant credential via IPEX
          const grantResponse = await ipexGrantCredential(
            _client!,
            issuerAlias,
            targetPrefix,
            credential
          );
          console.log("Grant response:", grantResponse);

          if (1 === 0) {
            console.log("No grant notifications found after granting credential.");
          }
          else {
            console.log(`Successfully issued and granted edge credential: ${credentialSaid}`);
          }
        }
      }
    }
    catch (error) {
      console.log('Error retrieving credential:', error);
    }
  };

  // Approve a credential request by submitting an IPEX admit message
  const approveCredentialRequest = async (
    issueeAidPrefix: string,
    issuerOOBI: string,
    issuerAidPrefix: string,
    grantSaid: string,
    grantNotificationId: string
  ) => {
    console.log('signify.approveCredentialRequest called with issuerOOBI:', issuerOOBI, 'grantSaid:', grantSaid, 'issuerAidPrefix:', issuerAidPrefix);
    // in case the client is not connected, try to connect
    const connected = await isConnected();
    // connected is false, it means the client session timed out or disconnected by user
    if (!connected) {
      validateClient();
    }

    try {
      console.log(`Submitting IPEX admit for grant "${grantSaid}" to recipient "${issuerAidPrefix}"`);

      const identifiers = await _client?.identifiers().list();
      const issuerContact = identifiers?.aids.find((identifier: any) => identifier.prefix == issueeAidPrefix);
      const issuerName = issuerContact?.name || issueeAidPrefix;

      console.log(`AID "${issuerName}" admitting IPEX grant "${grantSaid}" from AID "${issuerAidPrefix}"...`);


      const contacts = await _client?.contacts().list();
      console.log('Current contacts:', contacts?.map((c: any) => c.alias));


      const admitResult = await _client?.ipex().admit({
        senderName: issuerName,
        message: '',
        grantSaid: grantSaid,
        recipient: issuerAidPrefix,
        datetime: createTimestamp(),
      });

      if (!admitResult) {
        throw new Error("IPEX admit failed: result is undefined");
      }

      const [admit, sigs, aend] = admitResult;

      const admitOperationDetails = await _client?.ipex().submitAdmit(issuerName, admit, sigs, aend, [issuerAidPrefix]);

      const completedOperation: any = await _client?.operations().wait(admitOperationDetails);
      console.log("Completed operation:", completedOperation);

      if (completedOperation.error) {
        throw new Error(`IPEX admit submission failed: ${JSON.stringify(completedOperation.error)}`);
      }
      console.log(`Successfully submitted IPEX admit for grant "${grantSaid}".`);
      await _client?.operations().delete(completedOperation.name);

      console.log(`Marking notification "${grantNotificationId}" as read...`);
      try {
        await _client?.notifications().mark(grantNotificationId);
        console.log(`Notification "${grantNotificationId}" marked as read.`);
      } catch (error) {
        console.error(`Failed to mark notification "${grantNotificationId}" as read:`, error);
        throw error;
      }

      return { operation: completedOperation };
    } catch (error) {
      console.error('Failed to submit IPEX admit:', error);
      throw error;
    }

  };

  const removeProperties = (obj: any, propertiesToRemove: string[]): void => {
    propertiesToRemove.forEach(prop => {
      if (prop in obj) {
        delete obj[prop];
      }
    });
  }

  const retrieveSchema = async (schemaBaseUrl: any, grantExchange: any, schemaUrl: string) => {
    let schemaData = null;
    if (schemaBaseUrl && grantExchange?.exn?.e.acdc?.s) {
      try {
        console.log(`Attempting to fetch schema from: ${schemaUrl}`);
        const response = await fetch(schemaUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Signify Browser Extension'
          }
        });

        if (response.ok) {
          schemaData = await response.json();
          console.log("Successfully downloaded schema data:", schemaData);
        } else {
          console.error(`Failed to download schema from ${schemaUrl}:`, response.status, response.statusText);
          // Log response details for debugging
          const responseText = await response.text();
          console.error('Response body:', responseText);
        }
      } catch (error) {
        console.error(`Error downloading schema from ${schemaUrl}:`, error);
      }
    } else {
      console.warn('Missing schemaBaseUrl or schema SAID, skipping schema download');
    }
    return schemaData;
  }

  // Retrieve credential requests by scanning notifications for IPEX grant messages
  const getCredentialRequests = async () => {
    console.log('signify.getCredentialRequests called');
    var holderGrantNotifications = [];
    // in case the client is not connected, try to connect
    const connected = await isConnected();
    // connected is false, it means the client session timed out or disconnected by user
    if (!connected) {
      validateClient();
    }

    const ret: Array<{ title: string; description: string; values: any, issueeAidPrefix: string, issuerName: string; issuerOOBI: string; issuerAidPrefix: string; grantSaid: string; grantNotificationId: string; schemaSaid?: string }> = [];

    // Retrieve notifications and filter for unread IPEX grant notifications
    const notifications = await _client?.notifications().list();
    console.log("Fetched notifications:", notifications);

    holderGrantNotifications = await waitForAndGetNotification(_client!, IPEX_GRANT_ROUTE, 1, 1000);

    if (holderGrantNotifications.length === 0) {
      console.log("Grant notification not found");
    }
    else {
      console.log(`Found ${holderGrantNotifications.length} unread IPEX grant notifications:`, holderGrantNotifications);
      await Promise.all(holderGrantNotifications.map(async (n: any) => {
        const grantExchange = await _client?.exchanges().get(n?.a?.d);
        console.log("Fetched grant exchange:", grantExchange);

        // Get schema-url from local storage
        const schemaBaseUrl = await browserStorageService.getValue('schema-url');
        console.log("Retrieved schema-url from local storage:", schemaBaseUrl);

        const schemaUrl = `${schemaBaseUrl}/oobi/${grantExchange?.exn?.e.acdc?.s}`;

        // Download the schema resource with HTTP GET (service worker fetch)
        let schemaData = await retrieveSchema(schemaBaseUrl, grantExchange, schemaUrl);

        const credentialValues = grantExchange.exn.e.acdc.a;
        removeProperties(credentialValues, ["AID", "d", "i"]);

        const contacts = await _client?.contacts().list();
        const issuerContact = contacts?.find((contact: any) => contact.id == grantExchange?.exn?.i);
        console.log("Issuer contact:", issuerContact);
        const issuerName = issuerContact?.alias || grantExchange?.exn?.i;
        const issuerOOBI = issuerContact?.oobi as string || '';

        ret.push({
          'title': (schemaData as any)?.title || 'Unknown Title',
          'description': (schemaData as any)?.description || 'No description available',
          'values': credentialValues,
          'issueeAidPrefix': grantExchange?.exn?.a.i,
          'issuerName': issuerName,
          'issuerOOBI': issuerOOBI,
          'issuerAidPrefix': grantExchange?.exn?.e?.acdc?.i,
          'grantSaid': n?.a?.d,
          'grantNotificationId': n?.i,
          'schemaSaid': grantExchange?.exn?.e.acdc?.s, // Add the schema identifier
        });
      }));
    }

    return { 'requests': ret ?? [] };
  };

  return {
    connect,
    isConnected,
    disconnect,
    listIdentifiers,
    listCredentials,
    getCredential,
    createAID,
    generatePasscode,
    bootAndConnect,
    getControllerID,
    getSignedHeaders,
    authorizeSelectedSignin,
    getSessionInfo,
    removeSessionInfo,
    createAttestationCredential,
    getCredentialRequests,
    approveCredentialRequest,
  };
};

export const signifyService = Signify();


