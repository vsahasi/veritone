import type { Video, Speaker, Utterance, Analysis, TimelinePoint, QueryResponse } from "../types";
import { sentimentToScore, clamp } from "./utils";
import { SPEAKER_PALETTE } from "./constants";

// ─── Utterance Builder ────────────────────────────────────────────────────────

interface UtteranceInput {
  speakerId: number;
  speakerName: string;
  start: number;
  end: number;
  text: string;
  sentiment?: Utterance["semantic_sentiment"];
  vocal?: Utterance["vocal_affect"];
  visual?: Utterance["visual_affect"];
  divergence?: number;
  flag?: string | null;
}

function buildUtterance(
  id: number,
  index: number,
  videoId: number,
  u: UtteranceInput
): Utterance {
  const divergence = u.divergence ?? Math.random() * 0.28 + 0.05;
  const sentiment = u.sentiment ?? "neutral";
  const vocal = u.vocal ?? "confident";
  const visual = u.visual ?? "congruent";
  const semScore = sentimentToScore(sentiment);
  const vocStress =
    vocal === "stressed" ? clamp(divergence + 0.1 + Math.random() * 0.15, 0.3, 0.95) :
    vocal === "hesitant" ? clamp(divergence + 0.05, 0.2, 0.7) :
    clamp(0.3 - divergence * 0.2 + Math.random() * 0.1, 0.05, 0.5);
  const visCongruence =
    visual === "incongruent" ? clamp(1 - divergence - 0.1 + Math.random() * 0.1, 0.1, 0.5) :
    visual === "neutral" ? 0.6 + Math.random() * 0.15 :
    clamp(0.75 + Math.random() * 0.2, 0.6, 0.98);

  return {
    id,
    index,
    video_id: videoId,
    speaker_id: u.speakerId,
    speaker_name: u.speakerName,
    start_time: u.start,
    end_time: u.end,
    text: u.text,
    semantic_sentiment: sentiment,
    semantic_confidence: clamp(0.72 + Math.random() * 0.2, 0.65, 0.97),
    semantic_claim_density: clamp(semScore * 0.9 + Math.random() * 0.15, 0.1, 0.95),
    vocal_affect: vocal,
    vocal_stress_index: vocStress,
    vocal_f0_deviation: (Math.random() - 0.5) * 40,
    vocal_speech_rate: 140 + (Math.random() - 0.5) * 60,
    vocal_pause_before: Math.random() * 2.5,
    visual_affect: visual,
    visual_congruence_score: visCongruence,
    visual_blink_rate: 15 + Math.random() * 30 + (visual === "incongruent" ? 15 : 0),
    visual_lip_compression: visual === "incongruent" ? 0.55 + Math.random() * 0.3 : Math.random() * 0.35,
    visual_gaze_deviation: visual === "incongruent" ? 8 + Math.random() * 15 : Math.random() * 8,
    divergence_score: divergence,
    divergence_flag: u.flag !== undefined ? u.flag : divergence > 0.6 ? "Elevated multi-modal divergence" : null,
    divergence_details: {
      semantic_vocal_distance: clamp(Math.abs(semScore - vocStress) + Math.random() * 0.1, 0.05, 0.95),
      semantic_visual_distance: clamp(Math.abs(semScore - (1 - visCongruence)) + Math.random() * 0.1, 0.05, 0.95),
      vocal_visual_distance: clamp(Math.abs(vocStress - (1 - visCongruence)) + Math.random() * 0.1, 0.05, 0.95),
    },
  };
}

// ─── Tesla Q4 2024 Earnings Call ─────────────────────────────────────────────

const teslaSpeakers: Speaker[] = [
  {
    id: 0, label: "SPEAKER_00", name: "Elon Musk",
    utterance_count: 26, avg_divergence: 0.41, baseline_f0: 112,
    dominant_sentiment: "positive", dominant_vocal_affect: "animated", color: SPEAKER_PALETTE[0],
  },
  {
    id: 1, label: "SPEAKER_01", name: "Vaibhav Taneja",
    utterance_count: 16, avg_divergence: 0.18, baseline_f0: 98,
    dominant_sentiment: "neutral", dominant_vocal_affect: "confident", color: SPEAKER_PALETTE[1],
  },
];

const teslaRawUtterances: UtteranceInput[] = [
  { speakerId: 0, speakerName: "Elon Musk", start: 12, end: 28, text: "Welcome everyone to Tesla's Q4 2024 earnings call. We're excited to share what I believe is a pivotal set of results for the company.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.14 },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 31, end: 52, text: "Thank you, Elon. Let me begin with the financial highlights for the fourth quarter of 2024.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.09 },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 55, end: 89, text: "Total revenue for Q4 came in at 25.7 billion dollars, representing a 3.5 percent increase year over year, driven primarily by record deliveries.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.11 },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 92, end: 118, text: "Automotive gross margin was 18.2 percent for the quarter, which came in slightly below our internal guidance range of 19 to 20 percent.", sentiment: "neutral", vocal: "confident", visual: "neutral", divergence: 0.21 },
  { speakerId: 0, speakerName: "Elon Musk", start: 122, end: 148, text: "And I want to add context here — the margin compression is entirely explainable and entirely temporary. This is pricing strategy, not structural weakness.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.38, flag: "Verbal-vocal mismatch on financial defensive claim" },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 152, end: 183, text: "Free cash flow was 2.1 billion dollars for the quarter. We ended the year with 29.2 billion in cash and short-term investments.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.08 },
  { speakerId: 0, speakerName: "Elon Musk", start: 186, end: 215, text: "The energy business — and I cannot stress this enough — is growing at a rate that I think will genuinely shock people. Megapack deployments were up 157 percent.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.22 },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 218, end: 244, text: "Operating expenses increased to 2.4 billion, primarily due to elevated AI infrastructure investments and increased headcount in the software division.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.13 },
  { speakerId: 0, speakerName: "Elon Musk", start: 248, end: 284, text: "We're making bets that most companies simply wouldn't have the courage to make. And the returns on those infrastructure investments are going to be transformational.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.29 },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 288, end: 320, text: "On margins specifically, we are seeing some pricing pressure in key markets, particularly in the United States and Europe, and we are being deliberate about our response.", sentiment: "neutral", vocal: "confident", visual: "neutral", divergence: 0.34 },
  { speakerId: 0, speakerName: "Elon Musk", start: 324, end: 362, text: "The margin situation is... look, I want to be transparent here. We are navigating a competitive environment that has changed meaningfully over the past 18 months.", sentiment: "hedging", vocal: "hesitant", visual: "neutral", divergence: 0.58, flag: "Hesitation pattern on margin disclosure" },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 366, end: 392, text: "We remain confident in our path back to our target gross margin range of 20 to 22 percent over the course of 2025 as cost reductions flow through the business.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.42 },
  { speakerId: 0, speakerName: "Elon Musk", start: 396, end: 428, text: "Look, I want to be absolutely clear — we are fully committed to improving margins. The pricing decisions we made were intentional. They will prove correct. Full stop.", sentiment: "positive", vocal: "stressed", visual: "neutral", divergence: 0.67, flag: "Verbal-vocal mismatch on financial commitment" },
  { speakerId: 0, speakerName: "Elon Musk", start: 510, end: 548, text: "Full self-driving. I genuinely believe this is the most important software development in the history of transportation. Perhaps in the history of technology.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.26 },
  { speakerId: 0, speakerName: "Elon Musk", start: 552, end: 589, text: "We will have unsupervised FSD available to customers in Texas and California in Q1 2025. I am highly confident about this timeline.", sentiment: "positive", vocal: "stressed", visual: "incongruent", divergence: 0.82, flag: "High vocal stress on forward-looking timeline claim" },
  { speakerId: 0, speakerName: "Elon Musk", start: 592, end: 621, text: "The HW4 vehicles are performing exceptionally well in shadow mode testing. The miles-per-intervention metric has improved by a factor of six since September.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.31 },
  { speakerId: 0, speakerName: "Elon Musk", start: 624, end: 658, text: "I would put a significant amount of my personal credibility on the line in saying that FSD is a solved problem before the end of this year. Solved.", sentiment: "positive", vocal: "stressed", visual: "incongruent", divergence: 0.78, flag: "Verbal-vocal mismatch on bold forward-looking claim" },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 662, end: 688, text: "From a revenue recognition standpoint, we continue to defer FSD revenue in accordance with our accounting policy until full autonomy criteria are met.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.12 },
  { speakerId: 0, speakerName: "Elon Musk", start: 720, end: 754, text: "Cybertruck production is ramping extremely well. The team in Gigafactory Texas has done an extraordinary job solving some genuinely difficult manufacturing challenges.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.21 },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 757, end: 782, text: "Cybertruck deliveries in Q4 were approximately 17,300 units, meeting our internal production targets for the quarter.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.12 },
  { speakerId: 0, speakerName: "Elon Musk", start: 785, end: 819, text: "The demand signal for Cybertruck remains honestly overwhelming. We have a substantial order backlog and our owners are among the most vocal brand advocates we've ever seen.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.45 },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 822, end: 853, text: "We are targeting approximately 250,000 Cybertruck units in 2025, which would represent roughly a 14-times increase over our 2024 output.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.18 },
  { speakerId: 0, speakerName: "Elon Musk", start: 920, end: 956, text: "On the competitive question regarding Chinese OEMs — and I do not say this dismissively — I think our technology advantage is actually widening, not narrowing.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.35 },
  { speakerId: 0, speakerName: "Elon Musk", start: 959, end: 991, text: "BYD makes good cars. I've driven them. But our software stack, our AI inference capability, our energy ecosystem — there is no peer at this point.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.42 },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 994, end: 1018, text: "Our Shanghai gigafactory continued to operate at full capacity throughout Q4 and represents approximately 40 percent of global deliveries.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.11 },
  { speakerId: 0, speakerName: "Elon Musk", start: 1021, end: 1057, text: "The robotaxi network — and I want people to really internalize this — this is going to be the largest source of value ever created in the transportation sector. Enormous.", sentiment: "positive", vocal: "stressed", visual: "neutral", divergence: 0.63, flag: "Elevated vocal stress on speculative market claim" },
  { speakerId: 0, speakerName: "Elon Musk", start: 1120, end: 1156, text: "The question about board governance — I think our board is highly qualified, deeply independent, and exercises rigorous oversight of management decisions.", sentiment: "neutral", vocal: "hesitant", visual: "incongruent", divergence: 0.71, flag: "Deflecting response pattern on governance question" },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 1159, end: 1178, text: "We don't comment on pending regulatory matters as a matter of longstanding company policy.", sentiment: "neutral", vocal: "confident", visual: "neutral", divergence: 0.19 },
  { speakerId: 0, speakerName: "Elon Musk", start: 1181, end: 1213, text: "The Optimus robot program is tracking ahead of our internal schedule on every material metric. We expect meaningful revenue contribution beginning in 2026.", sentiment: "positive", vocal: "stressed", visual: "incongruent", divergence: 0.76, flag: "Verbal-vocal mismatch on product timeline claim" },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 1280, end: 1308, text: "To summarize Q4 — strong operational execution, record deliveries, solid energy revenue growth, with some near-term automotive margin pressure we are actively addressing.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.17 },
  { speakerId: 0, speakerName: "Elon Musk", start: 1312, end: 1346, text: "I've been doing this for a long time. I've built a lot of companies. And I want to say with genuine conviction: I have never been more certain about the future of Tesla than I am in this moment.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.33 },
  { speakerId: 1, speakerName: "Vaibhav Taneja", start: 1349, end: 1368, text: "Thank you all for joining the call. We look forward to updating you on Q1 results in April.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.07 },
  { speakerId: 0, speakerName: "Elon Musk", start: 1371, end: 1390, text: "Yeah, thanks everyone. Great questions today. Exciting times ahead.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.15 },
];

const teslaUtterances: Utterance[] = teslaRawUtterances.map((u, i) =>
  buildUtterance(i + 1, i, 1, u)
);

const teslaHighCount = teslaUtterances.filter((u) => u.divergence_score > 0.6).length;
const teslaAvgDiv = teslaUtterances.reduce((s, u) => s + u.divergence_score, 0) / teslaUtterances.length;
const teslaMaxDiv = Math.max(...teslaUtterances.map((u) => u.divergence_score));

// ─── TikTok Congressional Testimony ──────────────────────────────────────────

const tiktokSpeakers: Speaker[] = [
  {
    id: 0, label: "SPEAKER_00", name: "Shou Zi Chew",
    utterance_count: 22, avg_divergence: 0.38, baseline_f0: 102,
    dominant_sentiment: "hedging", dominant_vocal_affect: "hesitant", color: SPEAKER_PALETTE[0],
  },
  {
    id: 1, label: "SPEAKER_01", name: "Sen. Blackburn",
    utterance_count: 10, avg_divergence: 0.21, baseline_f0: 195,
    dominant_sentiment: "negative", dominant_vocal_affect: "animated", color: SPEAKER_PALETTE[2],
  },
  {
    id: 2, label: "SPEAKER_02", name: "Sen. Cantwell",
    utterance_count: 8, avg_divergence: 0.18, baseline_f0: 188,
    dominant_sentiment: "neutral", dominant_vocal_affect: "confident", color: SPEAKER_PALETTE[3],
  },
];

const tiktokRawUtterances: UtteranceInput[] = [
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 18, end: 62, text: "Chairman Wicker, Ranking Member Cantwell, and distinguished members of the committee — I am honored to appear before you today. My name is Shou Zi Chew and I am the CEO of TikTok.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.12 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 65, end: 108, text: "TikTok is used by 150 million Americans each month to connect with their communities, discover new ideas, and run small businesses that generate real economic value.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.16 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 111, end: 156, text: "I want to address the data security concerns directly. Project Texas — our initiative to ring-fence all US user data within the United States — is a 1.5 billion dollar commitment.", sentiment: "positive", vocal: "confident", visual: "neutral", divergence: 0.28 },
  { speakerId: 1, speakerName: "Sen. Blackburn", start: 210, end: 248, text: "Mr. Chew, can you tell this committee — yes or no — whether ByteDance, a Chinese company, has access to American user data right now, today?", sentiment: "negative", vocal: "animated", visual: "congruent", divergence: 0.22 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 251, end: 298, text: "Senator, I want to answer that with the precision it deserves. We have implemented controls — technical controls — that are specifically designed to prevent unauthorized access.", sentiment: "hedging", vocal: "hesitant", visual: "incongruent", divergence: 0.74, flag: "Deflecting yes/no question on data access" },
  { speakerId: 1, speakerName: "Sen. Blackburn", start: 301, end: 328, text: "That is not an answer to my question. The question was very simple: does ByteDance have access to American user data. Yes or no.", sentiment: "negative", vocal: "animated", visual: "congruent", divergence: 0.18 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 331, end: 374, text: "Senator, ByteDance is not an agent of China or any other country. I am confident that our current architecture, and Project Texas going forward, protects US user data.", sentiment: "positive", vocal: "stressed", visual: "incongruent", divergence: 0.81, flag: "Verbal-vocal mismatch: positive framing with high stress markers" },
  { speakerId: 2, speakerName: "Sen. Cantwell", start: 420, end: 462, text: "Mr. Chew, your algorithm — the recommendation engine — do you believe you have an obligation to make that algorithm transparent to users and regulators?", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.15 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 465, end: 504, text: "Senator Cantwell, we believe deeply in transparency. We have already provided regulators in multiple countries with significant access to our algorithmic architecture.", sentiment: "positive", vocal: "confident", visual: "neutral", divergence: 0.35 },
  { speakerId: 2, speakerName: "Sen. Cantwell", start: 507, end: 541, text: "But not to American regulators. Not to the FTC or FCC. You've engaged with European and Indian authorities, but American oversight has been consistently resisted.", sentiment: "negative", vocal: "confident", visual: "congruent", divergence: 0.21 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 544, end: 586, text: "I respectfully disagree with that characterization. We have been in productive dialogue with CFIUS since 2020 and have provided enormous amounts of documentation.", sentiment: "hedging", vocal: "stressed", visual: "incongruent", divergence: 0.68, flag: "Verbal-vocal incongruence on regulatory cooperation claim" },
  { speakerId: 1, speakerName: "Sen. Blackburn", start: 640, end: 678, text: "Let me read you a report from BuzzFeed News from 2022. And I quote: TikTok employees in China repeatedly accessed the private data of US users, including journalists.", sentiment: "negative", vocal: "animated", visual: "congruent", divergence: 0.19 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 681, end: 726, text: "Senator, I'm aware of those reports. That is exactly why we undertook Project Texas. The infrastructure we are building will make that type of access structurally impossible.", sentiment: "neutral", vocal: "hesitant", visual: "incongruent", divergence: 0.66, flag: "Visual incongruence during historical data access admission" },
  { speakerId: 1, speakerName: "Sen. Blackburn", start: 729, end: 758, text: "With respect, Mr. Chew, you keep saying 'will be' and 'going forward.' That doesn't address what happened. It doesn't address the ongoing risk.", sentiment: "negative", vocal: "animated", visual: "congruent", divergence: 0.16 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 761, end: 804, text: "Senator, I take the concerns of this committee extremely seriously. Our commitment to the safety of our users — particularly our young users — is absolute and non-negotiable.", sentiment: "positive", vocal: "stressed", visual: "incongruent", divergence: 0.72, flag: "Elevated stress on safety commitment statement" },
  { speakerId: 2, speakerName: "Sen. Cantwell", start: 860, end: 894, text: "On the mental health question — your own internal research, as reported, showed that Instagram was problematic for teenage girls. Has TikTok conducted comparable research?", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.14 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 897, end: 942, text: "We invest significantly in safety research. We have implemented time limits for users under 18, we've restricted direct messaging, and we've created a restricted mode.", sentiment: "positive", vocal: "confident", visual: "neutral", divergence: 0.29 },
  { speakerId: 2, speakerName: "Sen. Cantwell", start: 945, end: 972, text: "That is not the same as publishing your research. Has TikTok published peer-reviewed research on its mental health impact on minors?", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.11 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 975, end: 1018, text: "We have shared our research through appropriate channels with researchers and policymakers. I commit today to doing more on the transparency front in this specific area.", sentiment: "hedging", vocal: "hesitant", visual: "neutral", divergence: 0.52, flag: "Hedging on research transparency commitment" },
  { speakerId: 1, speakerName: "Sen. Blackburn", start: 1080, end: 1116, text: "Mr. Chew, if Congress passed legislation requiring divestiture from ByteDance, would you personally support that legislation?", sentiment: "negative", vocal: "animated", visual: "congruent", divergence: 0.20 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 1119, end: 1162, text: "Senator, I believe a divestiture would not solve the national security concerns that this committee has articulated. And I am not sure it is technically or commercially achievable.", sentiment: "deflecting", vocal: "stressed", visual: "incongruent", divergence: 0.77, flag: "Deflecting divestiture question with technical objections" },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 1220, end: 1268, text: "I want to close by saying that TikTok and its 150 million American users deserve a solution that is based on facts, not on hypothetical fears about a future that we are actively working to prevent.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.32 },
  { speakerId: 0, speakerName: "Shou Zi Chew", start: 1271, end: 1302, text: "Thank you for the opportunity to testify. I remain committed to working with this committee to address every legitimate concern that has been raised today.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.18 },
];

const tiktokUtterances: Utterance[] = tiktokRawUtterances.map((u, i) =>
  buildUtterance(i + 100, i, 2, u)
);

const tiktokHighCount = tiktokUtterances.filter((u) => u.divergence_score > 0.6).length;
const tiktokAvgDiv = tiktokUtterances.reduce((s, u) => s + u.divergence_score, 0) / tiktokUtterances.length;
const tiktokMaxDiv = Math.max(...tiktokUtterances.map((u) => u.divergence_score));

// ─── NASA Artemis III Press Conference ───────────────────────────────────────

const nasaSpeakers: Speaker[] = [
  {
    id: 0, label: "SPEAKER_00", name: "Bill Nelson",
    utterance_count: 14, avg_divergence: 0.24, baseline_f0: 108,
    dominant_sentiment: "positive", dominant_vocal_affect: "confident", color: SPEAKER_PALETTE[0],
  },
  {
    id: 1, label: "SPEAKER_01", name: "Howard Hu",
    utterance_count: 12, avg_divergence: 0.19, baseline_f0: 95,
    dominant_sentiment: "neutral", dominant_vocal_affect: "confident", color: SPEAKER_PALETTE[1],
  },
];

const nasaRawUtterances: UtteranceInput[] = [
  { speakerId: 0, speakerName: "Bill Nelson", start: 15, end: 52, text: "Good afternoon. Today we're here to provide an update on Artemis III — our return to the lunar surface — and I'm proud to say the program is advancing on all fronts.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.13 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 55, end: 92, text: "NASA is on track to return American astronauts to the Moon for the first time since 1972. And this time, we go to stay. We go to build. We go to learn.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.18 },
  { speakerId: 1, speakerName: "Howard Hu", start: 95, end: 142, text: "From a mission architecture standpoint, the Orion spacecraft has completed its post-Artemis II hardware integration review and is on track for our target launch window.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.11 },
  { speakerId: 1, speakerName: "Howard Hu", start: 145, end: 188, text: "The SpaceX Human Landing System has completed its third uncrewed lunar demonstration. The performance data from that mission exceeded our requirements across all critical parameters.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.14 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 191, end: 228, text: "We have selected the crew for Artemis III and I'm pleased to announce that training is proceeding on schedule at the Johnson Space Center.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.16 },
  { speakerId: 1, speakerName: "Howard Hu", start: 231, end: 278, text: "The South Pole landing site selection process is complete. We've identified the primary site and three contingency sites based on illumination data from the Lunar Reconnaissance Orbiter.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.10 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 340, end: 384, text: "On the budget question — I want to be direct. The President's budget request for NASA's exploration programs fully funds Artemis through mission completion. Congress has been a strong partner.", sentiment: "positive", vocal: "confident", visual: "neutral", divergence: 0.34 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 387, end: 428, text: "I understand there are concerns about cost growth. We're managing those concerns rigorously. The SLS program in particular has received significant attention from our oversight teams.", sentiment: "hedging", vocal: "hesitant", visual: "neutral", divergence: 0.57, flag: "Hesitation pattern on budget oversight statement" },
  { speakerId: 1, speakerName: "Howard Hu", start: 431, end: 474, text: "The SLS Block 1B vehicle, which Artemis III requires, has a more complex integration profile than Block 1 used in Artemis I and II. We've been transparent about that with the appropriations committees.", sentiment: "neutral", vocal: "confident", visual: "neutral", divergence: 0.28 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 520, end: 564, text: "The launch window question. I want to be careful about what I say here. We have a target. We have a credible path. We are not announcing a specific date today.", sentiment: "hedging", vocal: "hesitant", visual: "neutral", divergence: 0.61, flag: "Elevated hedging on timeline disclosure" },
  { speakerId: 1, speakerName: "Howard Hu", start: 567, end: 612, text: "The technical readiness across our key subsystems is at a level I'm genuinely proud of. Our teams have solved some very hard problems in the last 18 months.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.19 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 615, end: 658, text: "I want to answer the international partnership question. The Gateway lunar space station remains a core part of our long-term Artemis architecture despite some changes to its near-term scope.", sentiment: "neutral", vocal: "confident", visual: "neutral", divergence: 0.38 },
  { speakerId: 1, speakerName: "Howard Hu", start: 661, end: 704, text: "The Canadian Space Agency, JAXA, and ESA contributions to Gateway are on track. The international architecture diversifies our risk and strengthens the geopolitical case for the program.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.15 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 760, end: 804, text: "On SpaceX and concerns about single-provider risk — we take that seriously. We have ongoing discussions about the competitive landscape for future mission elements.", sentiment: "hedging", vocal: "hesitant", visual: "neutral", divergence: 0.52, flag: "Hedging on single-provider risk question" },
  { speakerId: 1, speakerName: "Howard Hu", start: 807, end: 848, text: "The SpaceX HLS contract structure includes performance milestones that protect the government's interests and align incentives appropriately across the program.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.22 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 851, end: 892, text: "This is the most ambitious space exploration program in human history. I want to close with that context. The challenges are real. The stakes are extraordinary. And America is leading.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.21 },
  { speakerId: 1, speakerName: "Howard Hu", start: 895, end: 928, text: "Thank you. The team behind this program is doing exceptional work every single day. We're all very proud of where Artemis III stands.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.14 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 931, end: 950, text: "We'll take a few more questions. Yes, go ahead.", sentiment: "neutral", vocal: "confident", visual: "congruent", divergence: 0.08 },
  { speakerId: 1, speakerName: "Howard Hu", start: 980, end: 1018, text: "The abort system and crew safety protocols — I want to be very clear — exceed every requirement in our human rating standards. Crew safety is our absolute first priority.", sentiment: "positive", vocal: "confident", visual: "congruent", divergence: 0.17 },
  { speakerId: 0, speakerName: "Bill Nelson", start: 1021, end: 1058, text: "Thank you all for being here. This is a great day for NASA and a great day for exploration. We will send humans back to the Moon, and I believe that day is closer than many people think.", sentiment: "positive", vocal: "animated", visual: "congruent", divergence: 0.22 },
];

const nasaUtterances: Utterance[] = nasaRawUtterances.map((u, i) =>
  buildUtterance(i + 200, i, 3, u)
);

const nasaHighCount = nasaUtterances.filter((u) => u.divergence_score > 0.6).length;
const nasaAvgDiv = nasaUtterances.reduce((s, u) => s + u.divergence_score, 0) / nasaUtterances.length;
const nasaMaxDiv = Math.max(...nasaUtterances.map((u) => u.divergence_score));

// ─── Videos ───────────────────────────────────────────────────────────────────

export const MOCK_VIDEOS: Video[] = [
  {
    id: 1,
    title: "Tesla Q4 2024 Earnings Call",
    source_url: "https://www.youtube.com/watch?v=example1",
    duration_seconds: 1390,
    speaker_count: 2,
    status: "complete",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    utterance_count: teslaUtterances.length,
    avg_divergence: parseFloat(teslaAvgDiv.toFixed(3)),
    max_divergence: parseFloat(teslaMaxDiv.toFixed(3)),
    high_divergence_count: teslaHighCount,
    thumbnail_url: "",
  },
  {
    id: 2,
    title: "TikTok CEO Congressional Testimony",
    source_url: "https://www.youtube.com/watch?v=example2",
    duration_seconds: 1310,
    speaker_count: 3,
    status: "complete",
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    utterance_count: tiktokUtterances.length,
    avg_divergence: parseFloat(tiktokAvgDiv.toFixed(3)),
    max_divergence: parseFloat(tiktokMaxDiv.toFixed(3)),
    high_divergence_count: tiktokHighCount,
    thumbnail_url: "",
  },
  {
    id: 3,
    title: "NASA Artemis III Press Conference",
    source_url: "https://www.youtube.com/watch?v=example3",
    duration_seconds: 1060,
    speaker_count: 2,
    status: "complete",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    utterance_count: nasaUtterances.length,
    avg_divergence: parseFloat(nasaAvgDiv.toFixed(3)),
    max_divergence: parseFloat(nasaMaxDiv.toFixed(3)),
    high_divergence_count: nasaHighCount,
    thumbnail_url: "",
  },
];

// ─── Analyses ─────────────────────────────────────────────────────────────────

function topFlags(utterances: Utterance[]): string[] {
  const flags = utterances
    .filter((u) => u.divergence_flag)
    .map((u) => u.divergence_flag as string);
  const counts = new Map<string, number>();
  flags.forEach((f) => counts.set(f, (counts.get(f) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => f);
}

export const MOCK_ANALYSES: Record<number, Analysis> = {
  1: {
    video: MOCK_VIDEOS[0],
    speakers: teslaSpeakers,
    utterances: teslaUtterances,
    summary: {
      total_utterances: teslaUtterances.length,
      avg_divergence: parseFloat(teslaAvgDiv.toFixed(3)),
      max_divergence: parseFloat(teslaMaxDiv.toFixed(3)),
      high_divergence_count: teslaHighCount,
      top_flags: topFlags(teslaUtterances),
      modality_agreement_rate: 0.64,
    },
  },
  2: {
    video: MOCK_VIDEOS[1],
    speakers: tiktokSpeakers,
    utterances: tiktokUtterances,
    summary: {
      total_utterances: tiktokUtterances.length,
      avg_divergence: parseFloat(tiktokAvgDiv.toFixed(3)),
      max_divergence: parseFloat(tiktokMaxDiv.toFixed(3)),
      high_divergence_count: tiktokHighCount,
      top_flags: topFlags(tiktokUtterances),
      modality_agreement_rate: 0.58,
    },
  },
  3: {
    video: MOCK_VIDEOS[2],
    speakers: nasaSpeakers,
    utterances: nasaUtterances,
    summary: {
      total_utterances: nasaUtterances.length,
      avg_divergence: parseFloat(nasaAvgDiv.toFixed(3)),
      max_divergence: parseFloat(nasaMaxDiv.toFixed(3)),
      high_divergence_count: nasaHighCount,
      top_flags: topFlags(nasaUtterances),
      modality_agreement_rate: 0.79,
    },
  },
};

// ─── Timeline ─────────────────────────────────────────────────────────────────

export function buildTimeline(utterances: Utterance[]): TimelinePoint[] {
  return utterances.map((u) => ({
    time: u.start_time,
    divergence_score: u.divergence_score,
    semantic_score: sentimentToScore(u.semantic_sentiment),
    vocal_score: u.vocal_stress_index,
    visual_score: 1 - u.visual_congruence_score,
    speaker_name: u.speaker_name,
    flag: u.divergence_flag,
  }));
}

// ─── Mock RAG Responses ───────────────────────────────────────────────────────

export const MOCK_QUERY_RESPONSES: Record<string, QueryResponse> = {
  default: {
    answer: "I analyzed the selected transcripts and found 8 high-divergence moments across all three speakers. The most significant pattern is a cluster of verbal-vocal mismatches occurring during forward-looking claims, where confident language is paired with elevated vocal stress markers.",
    sources: [
      { video_id: 1, video_title: "Tesla Q4 2024 Earnings Call", utterance_id: 14, speaker_name: "Elon Musk", start_time: 552, text: "We will have unsupervised FSD available to customers in Texas and California in Q1 2025.", divergence_score: 0.82 },
      { video_id: 2, video_title: "TikTok CEO Congressional Testimony", utterance_id: 106, speaker_name: "Shou Zi Chew", start_time: 331, text: "ByteDance is not an agent of China or any other country.", divergence_score: 0.81 },
      { video_id: 1, video_title: "Tesla Q4 2024 Earnings Call", utterance_id: 16, speaker_name: "Elon Musk", start_time: 624, text: "I would put a significant amount of my personal credibility on the line in saying that FSD is a solved problem before the end of this year.", divergence_score: 0.78 },
    ],
    tokens_used: 1842,
  },
  stress: {
    answer: "Vocal stress peaks are concentrated in three areas: (1) Elon Musk's FSD timeline statements show stress indices of 0.78–0.82, well above his baseline of 0.31. (2) Shou Zi Chew shows elevated stress (0.68–0.81) when discussing ByteDance's data access. (3) Bill Nelson's budget hedging shows moderate stress (0.57–0.61) relative to his otherwise low baseline.",
    sources: [
      { video_id: 1, video_title: "Tesla Q4 2024 Earnings Call", utterance_id: 14, speaker_name: "Elon Musk", start_time: 552, text: "We will have unsupervised FSD available to customers in Texas and California in Q1 2025.", divergence_score: 0.82 },
      { video_id: 2, video_title: "TikTok CEO Congressional Testimony", utterance_id: 106, speaker_name: "Shou Zi Chew", start_time: 331, text: "ByteDance is not an agent of China or any other country. I am confident that our current architecture protects US user data.", divergence_score: 0.81 },
    ],
    tokens_used: 1241,
  },
  speakers: {
    answer: "Speaker comparison across all three videos reveals a clear divergence hierarchy. Elon Musk shows the highest average divergence (0.41) with the widest variance — ranging from 0.09 during routine commentary to 0.82 on contested claims. Shou Zi Chew shows elevated visual incongruence (avg. congruence: 0.42) during national security topics. NASA officials Bill Nelson and Howard Hu show the lowest overall divergence (0.22 average) with spikes limited to budget and timeline questions.",
    sources: [
      { video_id: 1, video_title: "Tesla Q4 2024 Earnings Call", utterance_id: 10, speaker_name: "Elon Musk", start_time: 324, text: "The margin situation is... look, I want to be transparent here. We are navigating a competitive environment that has changed meaningfully.", divergence_score: 0.58 },
      { video_id: 2, video_title: "TikTok CEO Congressional Testimony", utterance_id: 104, speaker_name: "Shou Zi Chew", start_time: 251, text: "Senator, I want to answer that with the precision it deserves. We have implemented technical controls to prevent unauthorized access.", divergence_score: 0.74 },
      { video_id: 3, video_title: "NASA Artemis III Press Conference", utterance_id: 209, speaker_name: "Bill Nelson", start_time: 520, text: "The launch window question. I want to be careful about what I say here. We have a target. We have a credible path.", divergence_score: 0.61 },
    ],
    tokens_used: 2103,
  },
  visual: {
    answer: "Visual incongruence spikes correlate strongly with deflecting responses. Shou Zi Chew shows the highest visual incongruence, particularly when asked binary yes/no questions about data access — at these moments his visual congruence score drops to 0.28–0.41 while his verbal affect remains formally positive. Elon Musk shows visual incongruence specifically on FSD timeline claims and the Optimus robot statement.",
    sources: [
      { video_id: 2, video_title: "TikTok CEO Congressional Testimony", utterance_id: 106, speaker_name: "Shou Zi Chew", start_time: 331, text: "ByteDance is not an agent of China or any other country.", divergence_score: 0.81 },
      { video_id: 1, video_title: "Tesla Q4 2024 Earnings Call", utterance_id: 14, speaker_name: "Elon Musk", start_time: 552, text: "We will have unsupervised FSD available to customers in Texas and California in Q1 2025.", divergence_score: 0.82 },
    ],
    tokens_used: 1678,
  },
};
