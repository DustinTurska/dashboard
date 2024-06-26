import {
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Box,
  SimpleGrid,
  Alert,
  AlertDescription,
  AlertIcon,
  useDisclosure,
} from "@chakra-ui/react";
import { Button, Card, Heading, Text, Badge } from "tw-components";
import {
  useAccount,
  AccountPlan,
  AccountStatus,
} from "@3rdweb-sdk/react/hooks/useApi";
import { useEffect, useMemo, useState } from "react";
import { OnboardingBilling } from "./Billing";
import { OnboardingModal } from "./Modal";
import { PlanCard } from "./PlanCard";
import { ApplyForOpCreditsForm } from "./ApplyForOpCreditsForm";
import { useLocalStorage } from "hooks/useLocalStorage";
import { useTrack } from "hooks/analytics/useTrack";

export type CreditsRecord = {
  title: string;
  upTo?: true;
  credits: string;
  color: string;
  features?: string[];
  ctaTitle?: string;
  ctaHref?: string;
};

export const PlanToCreditsRecord: Record<AccountPlan, CreditsRecord> = {
  [AccountPlan.Free]: {
    title: "Starter",
    upTo: true,
    credits: "$250",
    color: "#3b394b",
  },
  [AccountPlan.Growth]: {
    title: "Growth",
    upTo: true,
    credits: "$2,500",
    color: "#28622A",
    features: [
      "10k monthly active wallets",
      "User analytics",
      "Custom Auth",
      "Custom Branding",
    ],
    ctaTitle: "Upgrade for $99",
    ctaHref: "/dashboard/settings/billing",
  },
  [AccountPlan.Pro]: {
    title: "Pro",
    credits: "$3,000+",
    color: "#282B6F",
    features: [
      "Custom rate limits for APIs & Infra",
      "Enterprise grade SLAs",
      "Dedicated support",
    ],
    ctaTitle: "Contact Us",
    ctaHref: "https://meetings.hubspot.com/sales-thirdweb/thirdweb-pro",
  },
  [AccountPlan.Enterprise]: {
    title: "Enterprise",
    credits: "Custom",
    color: "#000000",
  },
};

interface ApplyForOpCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApplyForOpCreditsModal: React.FC<ApplyForOpCreditsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isOpen: isPaymentMethodOpen,
    onOpen: onPaymentMethodOpen,
    onClose: onPaymentMethodClose,
  } = useDisclosure();
  const [page, setPage] = useState<"eligible" | "form">("eligible");
  const [hasAddedPaymentMethod, setHasAddedPaymentMethod] = useState(false);
  const account = useAccount();
  const [hasAppliedForOpGrant] = useLocalStorage(
    `appliedForOpGrant-${(account?.data && account.data.id) || ""}`,
    false,
  );
  const trackEvent = useTrack();

  useEffect(() => {
    trackEvent({
      category: "op-sponsorship",
      action: "modal",
      label: "view-modal",
    });
  }, [trackEvent]);

  const hasValidPayment = useMemo(() => {
    return (
      !!(account?.data?.status === AccountStatus.ValidPayment) ||
      hasAddedPaymentMethod
    );
  }, [account?.data?.status, hasAddedPaymentMethod]);

  const isFreePlan = account.data?.plan === AccountPlan.Free;
  const isProPlan = account.data?.plan === AccountPlan.Pro;

  const creditsRecord =
    PlanToCreditsRecord[account.data?.plan || AccountPlan.Free];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        onOverlayClick={() => setPage("eligible")}
        size="lg"
      >
        <ModalOverlay />
        {page === "eligible" ? (
          <ModalContent>
            <ModalHeader textAlign="center">Apply for Gas Credits</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex flexDir="column" gap={4}>
                <Card position="relative">
                  <Box position="absolute">
                    <Badge
                      borderRadius="full"
                      size="label.sm"
                      px={3}
                      bgColor={creditsRecord.color}
                    >
                      <Text
                        color="#fff"
                        textTransform="capitalize"
                        fontWeight="bold"
                      >
                        {creditsRecord.title}
                      </Text>
                    </Badge>
                  </Box>
                  <Flex alignItems="center" gap={2} flexDir="column">
                    <Text textAlign="center" color="faded">
                      {creditsRecord.upTo && "Up to"}
                    </Text>
                    <Heading
                      color="bgBlack"
                      size="title.lg"
                      fontWeight="extrabold"
                    >
                      {creditsRecord.credits}
                    </Heading>
                    <Text letterSpacing="wider" fontWeight="bold" color="faded">
                      GAS CREDITS
                    </Text>
                  </Flex>
                </Card>
                <Flex gap={4} flexDir="column">
                  {!hasValidPayment && (
                    <Alert
                      status="info"
                      borderRadius="lg"
                      backgroundColor="backgroundBody"
                      borderLeftColor="blue.500"
                      borderLeftWidth={4}
                      as={Flex}
                      gap={1}
                    >
                      <AlertIcon />
                      <Flex flexDir="column">
                        <AlertDescription as={Text}>
                          You need to add a payment method to be able to claim
                          credits. This is to prevent abuse, you will not be
                          charged.{" "}
                          <Text
                            as="span"
                            onClick={() => {
                              onPaymentMethodOpen();
                              trackEvent({
                                category: "op-sponsorship",
                                action: "add-payment-method",
                                label: "open",
                              });
                            }}
                            color="blue.500"
                            cursor="pointer"
                          >
                            Add a payment method
                          </Text>
                          .
                        </AlertDescription>
                      </Flex>
                    </Alert>
                  )}
                  <Button
                    colorScheme="primary"
                    onClick={() => setPage("form")}
                    w="full"
                    isDisabled={!hasValidPayment || hasAppliedForOpGrant}
                  >
                    {hasAppliedForOpGrant ? "Already applied" : "Apply Now"}
                  </Button>
                </Flex>
                {!isProPlan && (
                  <>
                    <Text
                      textAlign="center"
                      fontWeight="bold"
                      letterSpacing="wide"
                    >
                      Or upgrade and get access to more credits:
                    </Text>
                    <SimpleGrid
                      columns={{ base: 1, md: isFreePlan ? 2 : 1 }}
                      gap={4}
                    >
                      {isFreePlan && (
                        <PlanCard
                          creditsRecord={
                            PlanToCreditsRecord[AccountPlan.Growth]
                          }
                        />
                      )}
                      <PlanCard
                        creditsRecord={PlanToCreditsRecord[AccountPlan.Pro]}
                      />
                    </SimpleGrid>
                  </>
                )}
              </Flex>
              <Text mt={6} textAlign="center" color="faded">
                We are open to distributing more than the upper limit for each
                tier if you make a strong case about how it will be utilized.
              </Text>
            </ModalBody>

            <ModalFooter />
          </ModalContent>
        ) : (
          <ApplyForOpCreditsForm
            onClose={() => {
              setPage("eligible");
              onClose();
            }}
          />
        )}
      </Modal>

      {/* // Add Payment Method Modal */}
      <OnboardingModal
        isOpen={isPaymentMethodOpen}
        onClose={onPaymentMethodClose}
      >
        <OnboardingBilling
          onSave={() => {
            setHasAddedPaymentMethod(true);
            onPaymentMethodClose();
            trackEvent({
              category: "op-sponsorship",
              action: "add-payment-method",
              label: "success",
            });
          }}
          onCancel={() => {
            onPaymentMethodClose();
            trackEvent({
              category: "op-sponsorship",
              action: "add-payment-method",
              label: "cancel",
            });
          }}
        />
      </OnboardingModal>
    </>
  );
};
