import React, { useState, useEffect } from "react";
import { Box, Text } from "@components/ui";
import { CredentialRequestCard } from "@components/credentialRequestCard";
import { UI_EVENTS } from "@config/event-types";
import { sendMessage } from "@src/shared/browser/runtime-utils";

export function CredentialRequestsList() {
    console.log("CredentialRequestsList rendered");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await sendMessage({
      type: UI_EVENTS.fetch_resource_credential_requests,
    });
    setIsLoading(false);
    if (error) {
      setRequests([]);
    } else {
      setRequests(data?.requests ?? []);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (issueeAidPrefix: string, issuerName: string, issuerOOBI: string, issuerAidPrefix: string, grantSaid: string, grantNotificationId: string) => {
    setIsLoading(true);
    await sendMessage({
      type: UI_EVENTS.approve_credential_request,
      data: { issueeAidPrefix, issuerName, issuerOOBI, issuerAidPrefix, grantSaid, grantNotificationId } as any,
    });
    setIsLoading(false);
    fetchRequests();
  };

  return (
    <>
      {isLoading ? (
        <Text fontSize={0} $color="subtext">Loading...</Text>
      ) : requests.length ? (
        requests.map((request: any, idx: number) => (
            console.log("Rendering request:", request),
          <Box marginY={2} marginX={3} key={request.id || idx}>
            <CredentialRequestCard
              request={request}
              onApprove={() => handleApprove(request.issueeAidPrefix, request.issuerName, request.issuerOOBI, request.issuerAidPrefix, request.grantSaid, request.grantNotificationId)}
            />
          </Box>
        ))
      ) : (
        <Text fontSize={0} $color="subtext">No credential requests found.</Text>
      )}
    </>
  );
}
