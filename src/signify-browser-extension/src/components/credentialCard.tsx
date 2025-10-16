import { useIntl } from "react-intl";
import { ICredential } from "@config/types";
import { Text, Subtext, Card, Flex, Box } from "@components/ui";
import CredentialIcon from "@components/shared/icons/credential";
import ValidIcon from "@components/shared/icons/valid";
import RevokedIcon from "@components/shared/icons/revoked";
import { CredentialRecursiveChain } from "./credentialRecursiveChain";
import { getSchemaLogo } from "@shared/schema-logo-utils";

export function CredentialCard({
  credential,
  showExplore,
  exploreChain,
  idx,
}: {
  credential: ICredential;
  showExplore?: boolean;
  exploreChain?: (id: string) => void;
  idx?: number;
}): JSX.Element {
  const { formatMessage } = useIntl();
  
  // Debug logging to see credential structure
  console.log('CredentialCard - Full credential object:', credential);
  console.log('CredentialCard - credential.sad:', credential.sad);
  console.log('CredentialCard - credential.sad.a:', credential.sad?.a);
  console.log('CredentialCard - Available properties in sad.a:', credential.sad?.a ? Object.keys(credential.sad.a) : 'No sad.a');
  
  const schemaLogo = getSchemaLogo(credential.schema.$id);

  return (
    <Card>
      <>
        <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
          <Flex flexDirection="row" alignItems="center" $flexGap={2}>
            {schemaLogo.logo && (
              <img 
                src={schemaLogo.logo} 
                alt={schemaLogo.name || "Issuer Logo"} 
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
              />
            )}
            <Text fontSize={1} fontWeight="bold" $color="heading">
              {credential.schema.title}
            </Text>
          </Flex>
          <CredentialIcon size={6} />
        </Flex>
        <Box marginBottom={1} fontSize={0}>
          <Text $color="text">{credential.schema.credentialType}</Text>
        </Box>
        <Box marginBottom={1} fontSize={0}>
          <Text $color="text">{credential.schema.description}</Text>
        </Box>
        {/* Display credential attributes/properties from sad.a field, excluding system fields */}
        {
          credential.sad?.a && Object.entries(credential.sad.a)
            .filter(([key, value]) => !['i', 'd', 'dt'].includes(key) && value !== undefined && value !== null && value !== '')
            .map(([key, value]) => (
            <Box key={key} marginBottom={1} fontSize={0} fontWeight="bold">
              <Text $color="heading">{key.replace(/^./, s => s.toUpperCase()) // capitalize first letter
                .trim()}: <Subtext fontWeight="normal" $color="text">{String(value)}</Subtext></Text>
            </Box>
          ))
        }
        {credential.issueeName ? (
          <Box marginBottom={1}>
            <Text fontSize={0} fontWeight="bold" $color="heading">
              <>
                {formatMessage({ id: "credential.issuee.label" })}{" "}
                <Subtext fontWeight="normal" $color="text">
                  {credential.issueeName}
                </Subtext>
              </>
            </Text>
          </Box>
        ) : null}
        <Flex
          flexDirection="row-reverse"
          justifyContent="space-between"
          alignItems="center"
          fontSize={0}
        >
          {credential.status?.et === "iss" ? (
            <Flex flexDirection="column" alignItems="center" color="green">
              <ValidIcon size={6} />
              <Text $color="">{formatMessage({ id: "credential.valid" })}</Text>
            </Flex>
          ) : (
            <Flex flexDirection="column" alignItems="center" color="red">
              <RevokedIcon size={6} />
              <Text $color="">
                {formatMessage({ id: "credential.revoked" })}
              </Text>
            </Flex>
          )}
        </Flex>
        {showExplore && credential?.chains?.length ? (
          <CredentialRecursiveChain
            credential={credential}
            idx={String(idx)}
            openMessage={
              <Text $cursorPointer fontSize={0} $color="heading">
                {"explore >>"}
              </Text>
            }
            closeMessage={
              <Text $cursorPointer fontSize={0} $color="heading">
                {"close (x)"}
              </Text>
            }
            exploreChain={exploreChain}
          />
        ) : null}
      </>
    </Card>
  );
}
