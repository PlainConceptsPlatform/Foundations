"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageAvatar, MessageContent, MessageGroup } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Bot } from "lucide-react";

const messages = [
  { id: 1, text: "Hey, can you check the new chart component?", sender: "user" },
  { id: 2, text: "Already reviewed it — the Recharts integration looks solid.", sender: "bot" },
  { id: 3, text: "Great. Did the data-table typecheck pass?", sender: "user" },
  { id: 4, text: "Yes, TanStack Table is wired up and working.", sender: "bot" },
  { id: 5, text: "Let's ship it then.", sender: "user" },
];

export function MessageScrollerDemo() {
  return (
    <div className="h-80 w-full max-w-md rounded-lg border">
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {messages.map((msg) => (
                <MessageScrollerItem key={msg.id}>
                  <MessageGroup>
                    <Message align={msg.sender === "user" ? "end" : "start"}>
                      <MessageAvatar>
                        <Avatar>
                          <AvatarFallback>{msg.sender === "user" ? "U" : <Bot />}</AvatarFallback>
                        </Avatar>
                      </MessageAvatar>
                      <MessageContent>
                        <Bubble
                          variant={msg.sender === "user" ? "default" : "tinted"}
                          align={msg.sender === "user" ? "end" : "start"}
                        >
                          <BubbleContent>{msg.text}</BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageGroup>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}
