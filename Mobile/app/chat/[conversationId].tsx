import { Stack } from "expo-router";
import React from "react";
import { ChatScreen } from "../../src/features/chat/screens/ChatScreen";

export default function ChatRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatScreen />
    </>
  );
}
