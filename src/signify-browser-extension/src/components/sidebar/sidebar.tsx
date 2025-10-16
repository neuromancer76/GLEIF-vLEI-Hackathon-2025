import { useIntl, FormattedMessage } from "react-intl";
import { Flex, Subtext, Text } from "@components/ui";
import manifest from "@src/../manifest.json";
import IdentifierIcon from "@components/shared/icons/identifier";
import CredentialIcon from "@components/shared/icons/credential";
import CredentialRequestIcon from "@components/shared/icons/credential-request";
import SigninIcon from "@components/shared/icons/signin";
import LockIcon from "@components/shared/icons/lock";
import { Header } from "./header";
import {
  StyledSidebar,
  StyledMenu,
  StyledBottomMenu,
  StyledHeaderContainer,
  StyledLiContainer,
} from "./styled";

export const SIDEBAR_KEYS = {
  identifiers: "identifiers",
  credentials: "credentials",
  credentialRequests: "credential-requests",
  signin: "sign-ins",
};

export const SIDEBAR = [
  {
    id: SIDEBAR_KEYS.identifiers,
    icon: <IdentifierIcon size={6} />,
    title: <FormattedMessage id="identifiers.title" />,
  },
  {
    id: SIDEBAR_KEYS.credentials,
    icon: <CredentialIcon size={6} />,
    title: <FormattedMessage id="credentials.title" />,
  },
  {
    id: SIDEBAR_KEYS.credentialRequests,
    icon: <CredentialRequestIcon size={6} />,
    title: <FormattedMessage id="credentialRequests.title" />,
  },
  {
    id: SIDEBAR_KEYS.signin,
    icon: <SigninIcon size={6} />,
    title: <FormattedMessage id="signins.title" />,
  },
];

interface ISidebar {
  active: any;
  onClickLink: (active: any) => void;
  disabled?: boolean;
  onSignout: () => void;
  title?: string;
  logo?: string;
}

export function Sidebar(props: ISidebar): JSX.Element {
  const { formatMessage } = useIntl();
  return (
    <StyledSidebar id="default-sidebar" aria-label="Sidebar">
      <Flex paddingX={3}>
        <StyledHeaderContainer>
          <StyledLiContainer>
            <Header logo={props?.logo} title={props?.title} />
          </StyledLiContainer>
        </StyledHeaderContainer>
      </Flex>
      <Flex
        flexDirection="column"
        justifyContent="space-between"
        paddingX={3}
        overflowY="auto"
      >
        <ul>
          {SIDEBAR.map((element, index) => (
            <StyledLiContainer
              disabled={props.disabled}
              key={index}
              aria-disabled={props.disabled}
            >
              <StyledMenu
                onClick={() => !props.disabled && props.onClickLink(element)}
                alignItems="center"
                padding={2}
                borderRadius="8px"
                $isActive={element.id === props.active?.id}
                $flexGap={3}
              >
                {element.icon}
                <Subtext fontSize={0} $color="">
                  {element.title}
                </Subtext>
              </StyledMenu>
            </StyledLiContainer>
          ))}
        </ul>
      </Flex>
      <Flex flexDirection="column" paddingX={3}>
        <ul>
          <StyledLiContainer>
            <StyledBottomMenu
              onClick={props.onSignout}
              alignItems="center"
              padding={2}
              borderRadius="8px"
              $flexGap={3}
            >
              <LockIcon size={6} />
              <Subtext fontSize={0} $color="">
                {formatMessage({ id: "action.disconnect" })}
              </Subtext>
            </StyledBottomMenu>
          </StyledLiContainer>
        </ul>
      </Flex>
      <Flex
        width="100%"
        justifyContent="center"
        flexDirection="row"
        position="absolute"
        bottom="24px"
      >
        <Text $color="bodyColor">Version: {manifest.version}</Text>
      </Flex>
    </StyledSidebar>
  );
}
