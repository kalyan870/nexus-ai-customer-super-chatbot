export const PERSONAS = [
  'Support Specialist',
  'Technical Engineer',
  'Billing & Refunds',
  'Sales Advisor'
];

export async function runSuperBot({ message, persona = 'Support Specialist', db }) {
  const raw = (message || '').trim();
  const q = raw.toLowerCase();

  if (!raw) {
    return {
      text: `Hello! I am NEXUS (${persona}). Ask me to track an order (e.g., ORD-1001), check pricing, troubleshoot an API issue, or open a support ticket.`,
      intent: 'GREETING',
      persona,
      suggestions: ['Track order ORD-1001', 'Show pricing plans', 'Create support ticket', 'Clerk & Neon integration']
    };
  }

  // 1. Order Lookup (e.g. ORD-1001)
  const orderMatch = raw.match(/ORD-\d+/i);
  if (orderMatch || /order|track|shipping|delivery|package/i.test(q)) {
    const orderId = orderMatch ? orderMatch[0].toUpperCase() : 'ORD-1001';
    const order = await db.getOrder(orderId);
    if (order) {
      return {
        text: `Here is the live status for **${order.id}** (${order.productName}): currently **${order.status}**. Tracking: \`${order.trackingNumber}\` • ETA: ${order.eta}.`,
        intent: 'ORDER_STATUS',
        persona,
        card: { type: 'order', data: order },
        suggestions: ['Create support ticket', 'Refund policy', 'Track order ORD-1002']
      };
    }
    return {
      text: `I could not find order \`${orderId}\`. Please double-check your order ID (for example \`ORD-1001\`) or open a support ticket for our billing team.`,
      intent: 'ORDER_NOT_FOUND',
      persona,
      suggestions: ['Track order ORD-1001', 'Create support ticket']
    };
  }

  // 2. Support Ticket / Escalation
  if (/ticket|human|agent|escalate|bug|error|broken|issue|help\s?desk/i.test(q)) {
    return {
      text: `Understood (${persona}). Let's create a priority support ticket so our engineering & customer success team can resolve this quickly.`,
      intent: 'CREATE_TICKET',
      persona,
      action: 'OPEN_TICKET',
      suggestions: ['Track order ORD-1001', 'View refund policy']
    };
  }

  // 3. Knowledge Base Semantic Match
  const kbList = await db.listKb();
  let best = null;
  let bestScore = 0;
  for (const item of kbList) {
    let score = 0;
    for (const kw of item.keywords || []) {
      if (q.includes(kw.toLowerCase())) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (best && bestScore >= 2) {
    return {
      text: `**${best.title}**: ${best.content}`,
      intent: 'KB_ANSWER',
      persona,
      card: { type: 'kb', data: { title: best.title, category: best.category } },
      suggestions: ['Create support ticket', 'Track order ORD-1001']
    };
  }

  // 4. Greeting
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(q)) {
    return {
      text: `Hi there! I'm **NEXUS**, your ${persona}. I can look up orders in real time, answer billing or API questions, and escalate support tickets.`,
      intent: 'GREETING',
      persona,
      suggestions: ['Track order ORD-1001', 'Show pricing plans', 'Create support ticket']
    };
  }

  return {
    text: `[${persona}] I received your question: "${raw}". Would you like me to search our knowledge base, track an order (e.g. ORD-1001), or open a support ticket with a live specialist?`,
    intent: 'GENERAL_SUPPORT',
    persona,
    suggestions: ['Create support ticket', 'Track order ORD-1001', 'Show pricing plans']
  };
}
