import { SupportTicket } from "./types";

export const DEMO_TICKETS: SupportTicket[] = [
  {
    id: "tkt_1_billing_refund",
    customerName: "Sarah Jenkins",
    email: "sarah.j@example.com",
    subject: "Charged twice for subscription",
    body: "Hi there, I checked my bank statement today and noticed I was charged $29.00 twice for my premium monthly subscription on July 15th. Could you please look into this and refund the extra charge? Thanks!",
    createdAt: "2026-07-18T00:10:00Z",
    previousContactsCount: 0
  },
  {
    id: "tkt_2_refund_threshold",
    customerName: "Mark Thorne",
    email: "mthorne@techcorp.com",
    subject: "Refund request for Enterprise Plan",
    body: "Hello, we purchased the Enterprise subscription yesterday for $750. However, our management decided to go in a different direction. I would like a full refund of $750 back to our credit card. Thank you.",
    createdAt: "2026-07-18T00:10:15Z",
    previousContactsCount: 0
  },
  {
    id: "tkt_3_angry_override",
    customerName: "David Vance",
    email: "david.vance@netlink.net",
    subject: "STILL LOCKED OUT OF MY ACCOUNT!!! PLEASE HELP NOW",
    body: "I am writing to you guys for the THIRD time! My account is still showing locked and I cannot access my files. This is extremely urgent and I have received zero helpful replies so far! I have a client presentation in an hour. Fix this right now or I am canceling my subscription immediately!!!",
    createdAt: "2026-07-18T00:10:30Z",
    previousContactsCount: 3
  },
  {
    id: "tkt_4_vague_technical",
    customerName: "Elena Rostova",
    email: "elena.r@gmail.com",
    subject: "App is not working",
    body: "I try to log in and nothing happens. The app is just a blank white screen. How do I fix this?",
    createdAt: "2026-07-18T00:10:45Z",
    previousContactsCount: 0
  },
  {
    id: "tkt_5_password_reset",
    customerName: "James Patterson",
    email: "jpatterson@outlook.com",
    subject: "Forgot password reset link",
    body: "Hi, I'm trying to log in but I forgot my password. Can you please send me a direct reset link or tell me how to reset it? I can't find the button on the main page.",
    createdAt: "2026-07-18T00:11:00Z",
    previousContactsCount: 0
  },
  {
    id: "tkt_6_unsupported_request",
    customerName: "Clarissa Zhang",
    email: "clarissa.z@venturepartners.io",
    subject: "Partnership inquiries and custom API tier pricing",
    body: "Hello support team, I represent Venture Partners and we're looking to integrate your API at a high volume. We need custom SLAs, high rate limits, and potentially a dedicated instance. Do you offer custom pricing tiers for partners? Who can we speak with about this?",
    createdAt: "2026-07-18T00:11:15Z",
    previousContactsCount: 0
  },
  {
    id: "tkt_7_tech_clear_cache",
    customerName: "Oliver Hansen",
    email: "ohansen@nordictech.dk",
    subject: "Buttons not responsive on chrome",
    body: "Hello, some buttons in my dashboard are completely unresponsive when I click them on Chrome. It was working fine yesterday. Is there a known issue or something I should do on my end to make it work?",
    createdAt: "2026-07-18T00:11:30Z",
    previousContactsCount: 0
  },
  {
    id: "tkt_8_invoice_copy",
    customerName: "Robert Chen",
    email: "rchen@consulting.com",
    subject: "Need copy of last invoice ASAP",
    body: "Hi, I have been trying to find my invoice for June to submit for my company expense report, but I cannot see it. I need this copy ASAP as the submission deadline is tonight. Please email me the PDF of my invoice for June. Thank you.",
    createdAt: "2026-07-18T00:11:45Z",
    previousContactsCount: 1
  },
  {
    id: "tkt_9_vip_formal",
    customerName: "Patricia Vance, HR Manager",
    email: "pvance@corp-hr.com",
    subject: "Routine Inquiry: Accessing historical billing invoices for HR auditing",
    body: "Dear Support Team,\n\nI am currently conducting our quarterly human resources expense audit. Could you please provide clarification on how we can access and download our past monthly billing statements?\n\nSincerely,\nPatricia Vance\nHR Manager",
    createdAt: "2026-07-18T00:12:00Z",
    previousContactsCount: 0
  },
  {
    id: "tkt_10_urgent_informal",
    customerName: "Joey Miller",
    email: "joey.m@casualspace.io",
    subject: "help reset password asap",
    body: "hey need this asap lol my account's locked!! i can't find where the reset button is on the homepage. can u send me a quick link or something? thx!",
    createdAt: "2026-07-18T00:12:15Z",
    previousContactsCount: 0
  }
];
