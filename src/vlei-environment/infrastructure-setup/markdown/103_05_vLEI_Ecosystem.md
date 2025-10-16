# The GLEIF verifiable LEI (vLEI) Ecosystem

<div class="alert alert-primary">
<b>🎯 OBJECTIVE</b><hr>
To provide a theoretical understanding of the verifiable Legal Entity Identifier (vLEI) ecosystem. Including its architecture, the role of GLEIF as the Root of Trust, the underlying KERI and ACDC principles that enable its security and verifiability, and governance aspects.
</div>

## Introduction to the vLEI
The verifiable Legal Entity Identifier (vLEI) system, led by the Global Legal Entity Identifier Foundation (GLEIF), is a new kind of authentication (AuthN) and authorization (AuthZ) technology stack, representing a significant advancement in digital organizational identity capability.  It extends the traditional, widely adopted Legal Entity Identifier (LEI)  ecosystem into the digital realm, enabling secure, certain, and verifiable organizational identity in digital interactions.  The core purpose of the vLEI is to address critical challenges in the digital world, such as a strong, secure identity assurance, preventing identity impersonation and fraud, and the overall need for trustworthy authentication of organizations for business activity.

The vLEI leverages the robust security and verifiability features of the Key Event Receipt Infrastructure (KERI) and Authentic Chained Data Containers (ACDCs) protocols.  KERI provides the foundation for self-certifying, decentralized identifiers (AIDs), while ACDCs serve as the data sharing format as verifiable credentials, representing the vLEI itself and associated identity and data attestations.  This combination allows for automated cryptographic verification of an organization's identity, reducing risks and costs associated with traditional identity validation methods. 

The vLEI ecosystem is designed for a wide range of digital business activities, including, but not limited to:
- Approving business transactions and contracts with individualized attestations (signatures and credentials)
- Securely onboarding customers with reusable identity
- Reducing counterparty risk through automatable due diligence
- Facilitating trusted interactions within import/export and supply chain networks, again with reusable identity
- Streamlining regulatory filings and reports by tying them to individual signatures from organizational actors

## The GLEIF vLEI Ecosystem Architecture

The vLEI ecosystem is structured as a hierarchical chain of trust, with GLEIF positioned at its apex as shown in the below diagram, followed by qualified vLEI issuers (QVIs), legal entities that receive LEIs and vLEI credentials, and people within legal entities acting in official or contextual roles. This architecture ensures that all vLEIs and the authorities of entities issuing them can be cryptographically verified back to a common, trusted root.

<img src="./images/vlei-verification-chain.png" width="100%" alt="GLEIF Verification Chain"/>


### GLEIF as the Root of Trust

GLEIF serves as the ultimate Root of Trust in the vLEI ecosystem. This role is anchored by the **GLEIF Root AID**, a KERI-based identifier meticulously established and managed by GLEIF. The generation and administration of the GLEIF Root AID, along with its delegated AIDs, are governed by stringent policies emphasizing the highest duty of care, the use of self-certifying autonomic identifiers, and a strong cryptographic foundation.

<img src="./images/gleif-root-of-trust.png" width=650 alt="GLEIF Root of Trust and Delegated Identifier"/>


From the GLEIF Root AID, GLEIF establishes delegated AIDs for its operational purposes, such as:

- **GLEIF External Delegated AID (GEDA)**: Used by GLEIF to manage its relationship with and authorize **Qualified vLEI Issuers (QVIs)**.
The genesis of these core GLEIF AIDs involves a rigorous, multi-party ceremony with multiple **GLEIF Authorized Representatives (GARs)**, employing Out-of-Band Interaction (OOBI) sessions and challenge-response mechanisms to ensure authenticity and security.

### The Chain of Verifiable Authority

As shown above, and as abbreviated in the below image, the vLEI ecosystem operates on a clear cryptographic chain of verifiable trust, detailing how authority and credentials flow from GLEIF down to individual representatives of legal entities.

![vLEI Chain of Verifiable Authority](./images/chain-of-authority.png)

1. **GLEIF to Qualified vLEI Issuers (QVIs):**
The chain begins with GLEIF enabling **Qualified vLEI Issuers (QVIs)**. QVIs are organizations formally accredited by GLEIF to issue vLEI credentials to Legal Entities. They act as crucial intermediaries, extending GLEIF's trust into the broader ecosystem. GLEIF, through its GEDA, establishes a QVI's authority and operational capability by providing two key components:
    - A **QVI Delegated AID**: This is a KERI AID for the QVI, cryptographically delegated from GLEIF's own authority. The QVI uses this delegated AID for its operations within the vLEI ecosystem.
    - The **QVI vLEI Credential**: GLEIF issues this specific ACDC to the QVI. It serves as the QVI's formal, verifiable authorization from GLEIF, attesting to its status and its right to issue vLEI credentials to other legal entities.
1. **QVI to Legal Entity:**
Entitled by its delegated AID and its **Qualified vLEI Issuer vLEI Credential** from GLEIF, the QVI then issues a **Legal Entity vLEI Credential** to an organization (a Legal Entity). This ACDC represents the verified digital identity of the Legal Entity. To maintain the integrity of the trust chain, the Legal Entity vLEI Credential issued by the QVI includes a cryptographic link back to the "Qualified vLEI Issuer vLEI Credential" held by the issuing QVI. The Legal Entity itself, through its Legal Entity Authorized Representatives (LARs), creates and manages its own AID to which this credential is issued.
1. **Legal Entity and QVI in Issuance of Role Credentials:**
Once a Legal Entity holds its own valid Legal Entity vLEI Credential (and by extension, controls its own KERI AID), credentials can be issued to individuals representing the organization in various official or functional capacities. The issuance mechanism for these role credentials varies:
    - **Legal Entity Official Organizational Role (OOR) vLEI Credentials**: These are for individuals in formally recognized official roles within the Legal Entity (e.g., CEO, Director). OOR vLEI Credentials are issued by a QVI, contracted by the Legal Entity for this purpose.
    - **Legal Entity Engagement Context Role (ECR) vLEI Credentials**: These are for individuals representing the Legal Entity in other specific engagements or functional contexts. ECR vLEI Credentials can be issued either by a QVI (contracted by the Legal Entity) or directly by the Legal Entity itself. In all cases, these role credentials cryptographically link the individual, acting in their specified role, back to the Legal Entity's vLEI, thereby extending the verifiable chain of authority and context.
    - In each of these cases the actual OOR or ECR is issued by a QVI on request by a specific legal entity. Taking the form of OOR Authorization and ECR Authorization credentials, the legal entity makes a request to a QVI that an OOR or ECR credential be issued to a given person.

This layered delegation and credential issuance process ensures that the authority for each credential can be cryptographically verified up the chain, ultimately anchored with GLEIF as the Root of Trust for the entire vLEI ecosystem.

## Core Technical Principles
The vLEI ecosystem is built upon several core KERI principles and governance requirements to ensure its security, interoperability, and trustworthiness.

### Self-Certifying Identifiers (AIDs)
All identifiers within the vLEI ecosystem are KERI Autonomic Identifiers (AIDs).  AIDs are self-certifying, meaning their authenticity can be verified directly using cryptography alone, without reliance on a central registry for the identifier itself.  An AID is cryptographically bound to key pairs controlled by an entity.  Both transferable AIDs (whose control can be rotated to new keys) and non-transferable AIDs (e.g., for witnesses) are used in the vLEI ecosystem.

### Key Management and Security
KERI's advanced key management features are integral to the vLEI ecosystem's security:
- **Pre-rotation:** KERI's pre-rotation mechanism is employed, where the commitment to the next set of keys is made in the current key establishment event (inception or rotation).  This enhances security by ensuring that new keys are not exposed until they are actively used for rotation. 
- **Multi-signature (Multi-sig):** Multi-sig control is extensively used as a form of multi-party computation (MPC), especially for critical identities like the GLEIF Root AID and QVI AIDs.  This requires signatures from multiple authorized parties to approve an event, significantly increasing resilience against compromise.
- **Cooperative Delegation:** KERI's cooperative delegation model is used for delegating AIDs (e.g., GLEIF delegating to QVIs).  This requires cryptographic commitment from both the delegator and the delegate, enhancing security as an attacker would need to compromise keys from both entities. 

### Use of KERI Infrastructure
The vLEI ecosystem relies on standard KERI infrastructure components:
- **Witnesses:** These are entities designated by an AID controller to receive, verify, sign (receipt), and store key events.  They ensure the availability and consistency of Key Event Logs (KELs) for signers.  GLEIF maintains its own Witness pool for its AIDs, and QVIs also utilize witnesses.
  - Currently (June 2025) witnesses are also used as mailboxes, a store and forward communication relay similar to DIDComm Relays (formerly known as Mediators).
- **Watchers:** Entities that keep copies of KELs (or Key Event Receipt Logs - KERLs) to independently verify the state of AIDs.  Verifiers and Validators may use Watcher networks to protect the integrity of their verification process. You can think of Watchers as primarily verification infrastructure. Similar to how witnesses provide a signing threshold, watchers may be used to provide a verification threshold as a part of a verification process or workflow.
- **Mailboxes:** The always-online store and forward mechanism for AID controllers to receive messages even when the controlling device is offline or unavailable.
  - As stated above, mailboxes are currently deployed with witnesses. Work is underway to provide an open-source, production grade, multi-tenant, standalone mailbox service. There are infrastructure vendors who provide such standalonemailbox services.

### ACDC and Schema Requirements
vLEIs are implemented as Authentic Chained Data Containers (ACDCs). 

- **Structure:** ACDCs have a defined structure including an envelope (metadata) and payload (attributes, and optionally, edges and rules). 
- **SAIDs:** Both ACDCs and their schemas are identified by Self-Addressing Identifiers (SAIDs), which are cryptographic digests of their content, ensuring tamper-evidence and cryptographic integrity. 
- **Schemas:** All vLEI credentials adhere to official JSON Schemas published by GLEIF.  These schemas are also SAIDified and versioned.  The schema registry provides the SAIDs and URLs for these official schemas. 
- **Serialization:** JSON serialization is mandatory for vLEI credentials. 
- **Proof Format:** Signatures use the Ed25519 CESR Proof Format. 

### Importance of OOBI and Challenge-Response
- **Out-of-Band Introductions (OOBIs):** Used for discovery, allowing controllers to find each other's KELs and schema definitions.  For instance, GARs use OOBI protocols during the GLEIF AID genesis, and also use OOBIs to resolve ACDC schema locations. 
- **Challenge-Response:** This protocol is crucial for mutual authentication between controllers after initial discovery via OOBI.  It ensures that the entity on the other side genuinely possesses the private keys for the AID they claim to control.  This involves exchanging unique challenge messages and verifying signed responses.

## The Legal Entity vLEI Credential
The primary credential issued to an organization within the vLEI ecosystem is the Legal Entity vLEI Credential.  Its purpose is to provide a simple, safe, and secure way to identify the Legal Entity who holds it to any verifier wanting to verify a vLEI credential. 

![vLEI Legal Entity Credential](./images/le-credential.png)

### Issuance Process
The issuance of a Legal Entity vLEI Credential by a QVI to a Legal Entity is a process governed by the [vLEI Ecosystem Framework](https://www.gleif.org/en/organizational-identity/introducing-the-verifiable-lei-vlei/introducing-the-vlei-ecosystem-governance-framework): 

1. **Identity Verification of Legal Entity Representatives:** The QVI must perform thorough Identity Assurance and Identity Authentication of the Legal Entity's representatives:
    - **Designated Authorized Representatives (DARs):** These individuals are authorized by the Legal Entity to, among other things, designate LARs.  Their identity and authority must be verified by the QVI. 
    - **Legal Entity Authorized Representatives (LARs):** These individuals are designated by DARs and are authorized to request and manage vLEI credentials on behalf of the Legal Entity.  Their identities must also be assured and authenticated.  This often involves real-time OOBI sessions with the QAR (QVI Authorized Representative), sharing of AIDs, and a challenge-response process. 

1. **Multi-Signature by LARs:** For enhanced security, if a Legal Entity has multiple LARs, the Legal Entity vLEI Credential typically requires multi-signatures from a threshold of LARs to accept and manage it.  The LARs form a multi-sig group to control the Legal Entity's AID. 

1. **QVI Issuance Workflow:** The QVI itself follows a dual-control process, often involving two or more QARs, for issuing and signing the Legal Entity vLEI Credential. 

1. **Reporting:** QVIs must report issuance events to GLEIF through the vLEI Reporting API.  GLEIF then updates the Legal Entity's LEI page to reflect the issued vLEI credentials, as shown on GLEIF's [organization page](https://search.gleif.org/#/record/506700GE1G29325QX363/verifiable_credentials). 

The Legal Entity vLEI Credential schema specifies required fields, including the "LEI" of the Legal Entity.  It also uses the ACDC "sources" section to chain back to the QVI who authorized the credential, representing a verifiable chain of trust.

## Revocation in the vLEI Ecosystem
Revocation is a critical aspect of any credentialing system.  In the vLEI ecosystem, credentials can be revoked if they are compromised, if the underlying LEI lapses, or if an individual no longer holds an authorized role. 

- **Mechanism:** Revocation is performed by the original issuer of the credential.  It involves recording a revocation event in the credential's Transaction Event Log (TEL) within the issuer's credential registry.  This TEL event is anchored to the issuer's KEL.

- **Legal Entity vLEI Credential Revocation:** A QAR revokes a Legal Entity vLEI Credential upon a fully signed request from the Legal Entity's LAR(s) or due to involuntary reasons (e.g., lapsed LEI).  The QAR reports this revocation to GLEIF. 

- **Role Credential Revocation:** For OOR or ECR credentials, the Legal Entity typically notifies the QVI (if QVI-issued) or handles it internally (if LE-issued) to revoke the credential when a person's role changes or employment ends. 

The vLEI framework ensures that revocation status is verifiable, allowing relying parties to confirm the ongoing validity of a presented credential.

<div class="alert alert-prymary">
<b>📝 SUMMARY</b><hr>
The GLEIF vLEI ecosystem provides a robust framework for digital organizational identity, leveraging KERI for secure, decentralized identifiers (AIDs) and ACDCs for verifiable credentials. GLEIF acts as the Root of Trust, delegating authority to Qualified vLEI Issuers (QVIs) who, in turn, issue vLEI credentials to Legal Entities.  These Legal Entities can then issue role-specific vLEI credentials to individuals. 
<br><br>
Key principles include self-certifying AIDs, advanced key management (pre-rotation, multi-sig), cooperative delegation, and the use of KERI infrastructure like Witnesses and Watchers.  vLEIs and their schemas are SAID-ified for tamper-evidence and integrity.  The issuance and presentation of vLEIs utilize the IPEX protocol, with OOBI and challenge-response mechanisms ensuring secure discovery and authentication.  Rigorous identity verification processes are mandated for issuing credentials, particularly the Legal Entity vLEI Credential, involving DARs and LARs.  The system also includes defined processes for credential revocation. 
</div>

[<- Prev (Third Party Tools)](102_30_Third_Party_Tools.ipynb) | [Next (vLEI Trust Chain) ->](103_10_vLEI_Trust_Chain.ipynb)
