import browser from "webextension-polyfill";
import { getExtId } from "@src/shared/browser/runtime-utils";
import { getCurrentTab } from "@src/shared/browser/tabs-utils";

export const senderIsPopup = (sender: browser.Runtime.MessageSender) => {
  return (
    (sender.url?.startsWith("moz-extension://") ||
      sender.url?.startsWith("chrome-extension://")) &&
    sender.url?.endsWith("/src/pages/popup/index.html") &&
    sender.id === getExtId()
  );
};

export const getCurrentUrl = async () => {
  const currentTab = await getCurrentTab();
  console.log("Current tab: ", currentTab);
  try {
    return new URL(currentTab.url!)
  } catch (error) {
    console.error("Error getting current tab URL: ", error);
    return new URL("http://localhost:3000");
  }
};
