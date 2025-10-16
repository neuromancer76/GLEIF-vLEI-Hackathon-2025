import { useIntl } from "react-intl";
import { Card, Flex, Box, Text, Subtext } from "@components/ui";
import CredentialIcon from "@components/shared/icons/credential";
import { getSchemaLogo } from "@shared/schema-logo-utils";
import { ICredentialRequest } from "@config/types";

export function CredentialRequestCard({ request, onApprove }: {
  request: ICredentialRequest;
  onApprove?: (issuerName: string,
    issuerAidPrefix: string,
    grantSaid: string) => void;
}): JSX.Element {
  const { formatMessage } = useIntl();
  
  // Try to get schema ID from various possible fields
  const schemaLogo = getSchemaLogo(request.schemaSaid);
  
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
              {request.title}
            </Text>
          </Flex>
          <CredentialIcon size={6} />
        </Flex>
        <Box marginBottom={1} fontSize={0}>
          <Text $color="text">{request.description}</Text>
        </Box>
        {
          Object.entries(request.values).map(([key, value]) => (
            <Box key={key} marginBottom={1} fontSize={0} fontWeight="bold">
              <Text $color="heading">{key.replace(/^./, s => s.toUpperCase()) // capitalize first letter
                .trim()}: <Subtext fontWeight="normal" $color="text">{value}</Subtext></Text>
            </Box>
          ))
        }
        {request.issuerName ? (
          <Box marginBottom={1}>
            <Text fontSize={0} fontWeight="bold" $color="heading">
              <>
                Issuer: <Subtext fontWeight="normal" $color="text">{request.issuerName}</Subtext>
              </>
            </Text>
          </Box>
        ) : null}
        <Flex flexDirection="row" justifyContent="flex-end" $flexGap={2} marginTop={2}>
          {onApprove && (
            <button onClick={() => onApprove(request.issuerName || "", request.issuerAidPrefix, request.grantSaid)} style={{ marginRight: 8, padding: "4px 12px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Accept</button>
          )}
        </Flex>
      </>
    </Card>
  );
}
