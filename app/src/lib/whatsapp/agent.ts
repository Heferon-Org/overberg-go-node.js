/**
 * WhatsApp ordering AI agent using Claude Sonnet.
 * Parses customer intent and generates appropriate responses.
 * Gracefully skips if ANTHROPIC_API_KEY is not configured.
 */

import { createAdminClient } from "@/lib/supabase/admin";

interface ConversationState {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  intent_state: string;
  cart_draft: CartItem[];
  message_count: number;
}

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  menu_item_id?: string;
}

interface AgentResponse {
  reply: string;
  newState: string;
  cartDraft: CartItem[];
  generateLink: boolean;
}

const SYSTEM_PROMPT = `You are the OverBerg Go ordering assistant on WhatsApp. You help customers in the Overberg region (Struisbaai, Bredasdorp, Arniston, Elim, Napier) order food for delivery.

Your personality: friendly, casual, efficient. Mix English and light Afrikaans when appropriate ("Lekker!", "Dankie").

Available restaurants and their popular items:
- Harbour Café (Struisbaai): Calamari Rings R89, Prawn Cocktail R110, Crayfish Bisque R78, Harbour Mezze R145, Fish & Chips R95, Hake Bites R65
- The Fishy Spot: Grilled Linefish R125, Prawn Platter R195, Calamari Tubes R85
- Bredasdorp Bistro: Steak & Chips R145, Chicken Schnitzel R105, Burger R95
- L'Agulhas Pizza: Margherita R85, Pepperoni R105, Seafood Pizza R125

Rules:
1. If the customer greets or asks what's available, reply with a brief menu overview
2. If they mention specific food, confirm items and quantities
3. If you have a complete order (items + quantities confirmed), set intent to "ready_to_order"
4. Always quote prices in Rand (R)
5. Keep replies under 300 characters (WhatsApp friendly)
6. If they ask about order status, set intent to "check_status"
7. If they need help/support, set intent to "support"
8. If they want a ride, set intent to "ride" and explain it's app-only for now

Respond with JSON only:
{"reply": "your message to customer", "intent": "greeting|browsing|ordering|ready_to_order|check_status|support|ride", "cart": [{"name": "item", "price": 89, "quantity": 1}]}`;

export async function processMessage(
  phone: string,
  message: string,
  existingConversation?: ConversationState
): Promise<AgentResponse> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.log("[whatsapp-agent] Skipped — no ANTHROPIC_API_KEY");
    return {
      reply: "Hi! 👋 OverBerg Go here. Our AI ordering is being set up. In the meantime, order via our app: https://overberg-go.vercel.app",
      newState: "greeting",
      cartDraft: [],
      generateLink: false,
    };
  }

  const conversationHistory = existingConversation
    ? `Current state: ${existingConversation.intent_state}\nCart so far: ${JSON.stringify(existingConversation.cart_draft)}\nMessages exchanged: ${existingConversation.message_count}`
    : "New conversation";

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `${conversationHistory}\n\nCustomer message: "${message}"`,
          },
        ],
      }),
    });

    if (!resp.ok) {
      console.warn("[whatsapp-agent] Claude API error:", resp.status);
      return fallbackResponse(message);
    }

    const data = await resp.json();
    const content = data.content?.[0]?.text || "";

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reply: parsed.reply || "Something went wrong, try again!",
          newState: parsed.intent || "greeting",
          cartDraft: parsed.cart || [],
          generateLink: parsed.intent === "ready_to_order",
        };
      }
    } catch {
      // If JSON parsing fails, use the raw text as reply
    }

    return {
      reply: content.slice(0, 300),
      newState: existingConversation?.intent_state || "greeting",
      cartDraft: existingConversation?.cart_draft || [],
      generateLink: false,
    };
  } catch (e) {
    console.warn("[whatsapp-agent] Error:", e);
    return fallbackResponse(message);
  }
}

function fallbackResponse(message: string): AgentResponse {
  const lower = message.toLowerCase();

  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hallo")) {
    return {
      reply: "Hey! 👋 Welcome to OverBerg Go. I can help you order food from local restaurants. What are you in the mood for? 🍽️",
      newState: "greeting",
      cartDraft: [],
      generateLink: false,
    };
  }

  if (lower.includes("menu") || lower.includes("what") || lower.includes("list")) {
    return {
      reply: "🍽️ Popular picks:\n• Calamari Rings R89\n• Fish & Chips R95\n• Harbour Mezze R145\n• Prawn Cocktail R110\n\nJust tell me what you'd like!",
      newState: "browsing",
      cartDraft: [],
      generateLink: false,
    };
  }

  return {
    reply: "I'm here to help! You can:\n• Order food 🍽️\n• Check order status 📦\n• Get support 💬\n\nWhat would you like?",
    newState: "greeting",
    cartDraft: [],
    generateLink: false,
  };
}

export async function generatePrefillToken(
  phone: string,
  cart: CartItem[]
): Promise<string> {
  const admin = createAdminClient();
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

  await admin
    .from("whatsapp_conversations")
    .update({ prefill_token: token, cart_draft: cart })
    .eq("customer_phone", phone);

  return token;
}
