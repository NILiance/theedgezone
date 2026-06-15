/**
 * Personal Brand Toolkit prompt builders — verbatim spirit-port of the
 * legacy WP plugin's 10-section coaching toolkit. Each builder receives
 * the talent's profile (name, sport, school, goals, tagline, social
 * handles) and returns a markdown-heavy prompt Claude can answer.
 */

export interface ToolkitContext {
  name: string
  sport?: string | null
  position?: string | null
  school?: string | null
  jerseyNumber?: string | null
  tagline?: string | null
  goals?: string | null
  socialHandles?: Record<string, string> | null
  vibe?: string | null
  audience?: string | null
}

export interface ToolkitSection {
  id: string
  label: string
  icon: string
  color: string
  desc: string
}

/** The 10 sections shown as cards. Order matches the legacy. */
export const TOOLKIT_SECTIONS: ToolkitSection[] = [
  {
    id: 'launch',
    label: 'Brand Launch Playbook',
    icon: '🚀',
    color: '#e67e22',
    desc: 'Your first 7 days — platform-by-platform rollout strategy.',
  },
  {
    id: 'nil_deals',
    label: 'NIL Deal Toolkit',
    icon: '💰',
    color: '#2ecc71',
    desc: 'How to pitch brands, outreach templates, pricing yourself.',
  },
  {
    id: 'content',
    label: 'Content Strategy',
    icon: '📱',
    color: '#3498db',
    desc: 'Weekly posting schedule, 30+ content ideas, hashtag strategy.',
  },
  {
    id: 'growth',
    label: 'Growth Playbook',
    icon: '📈',
    color: '#9b59b6',
    desc: 'Grow your following, engagement tactics, game day strategy.',
  },
  {
    id: 'protection',
    label: 'Brand Protection',
    icon: '🛡️',
    color: '#e74c3c',
    desc: 'Logo usage rules, consistency guidelines, what NOT to post.',
  },
  {
    id: 'pitch_deck',
    label: 'Sponsor Pitch Template',
    icon: '💼',
    color: '#f39c12',
    desc: 'Fill-in-the-blank pitch for reaching out to brands.',
  },
  {
    id: 'bio_writer',
    label: 'Bio & Caption Writer',
    icon: '✍️',
    color: '#1abc9c',
    desc: 'Platform-optimized bios and captions for your brand.',
  },
  {
    id: 'email_templates',
    label: 'Outreach Templates',
    icon: '✉️',
    color: '#3498db',
    desc: 'Pre-written emails and DMs for brand partnerships.',
  },
  {
    id: 'game_day',
    label: 'Game Day Playbook',
    icon: '🏈',
    color: '#e67e22',
    desc: 'Pre-game, during, post-game content strategy.',
  },
  {
    id: 'offseason',
    label: 'Off-Season Strategy',
    icon: '🏖️',
    color: '#9b59b6',
    desc: 'Stay relevant and grow your brand year-round.',
  },
]

export const TOOLKIT_SECTION_MAP = Object.fromEntries(
  TOOLKIT_SECTIONS.map((s) => [s.id, s])
) as Record<string, ToolkitSection>

function contextBlock(ctx: ToolkitContext): string {
  const lines: string[] = [
    `Athlete: ${ctx.name}`,
    ctx.sport ? `Sport: ${ctx.sport}` : '',
    ctx.position ? `Position: ${ctx.position}` : '',
    ctx.school ? `School: ${ctx.school}` : '',
    ctx.jerseyNumber ? `Jersey #: ${ctx.jerseyNumber}` : '',
    ctx.tagline ? `Tagline: "${ctx.tagline}"` : '',
    ctx.goals ? `Goals: ${ctx.goals}` : '',
    ctx.vibe ? `Brand vibe: ${ctx.vibe}` : '',
    ctx.audience ? `Audience: ${ctx.audience}` : '',
  ].filter(Boolean)
  const socials = ctx.socialHandles
    ? Object.entries(ctx.socialHandles)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: @${v.replace(/^@+/, '')}`)
        .join(', ')
    : ''
  if (socials) lines.push(`Social handles: ${socials}`)
  return lines.join('\n')
}

const COMMON_STYLE = `
Format the response as well-structured markdown. Use H2/H3 headings,
short paragraphs, bullet lists, and code-fenced blocks ONLY for fill-in
templates that the talent should copy-paste. Keep the tone direct,
confident, athlete-friendly. Cut the corporate fluff.`.trim()

export function buildToolkitPrompt(sectionId: string, ctx: ToolkitContext): string {
  const profile = contextBlock(ctx)
  const intro =
    `Here is the athlete's profile:\n\n${profile}\n\n` +
    `Generate personalized, actionable coaching content for the section below. Reference the athlete's actual sport, school, goals, and existing handles wherever it makes the advice more concrete.\n\n${COMMON_STYLE}\n\n---\n\n`

  switch (sectionId) {
    case 'launch':
      return (
        intro +
        `Section: BRAND LAUNCH PLAYBOOK\n\n` +
        `Create the athlete's first 7 days of brand launch — platform by platform. Day 1 → Day 7. For each day include: which platform, what to post, the exact caption (use [BRACKETS] for blanks), 3-5 hashtag suggestions, and a single coaching note. Open with a short Hero section: why a structured launch matters and what to expect.`
      )
    case 'nil_deals':
      return (
        intro +
        `Section: NIL DEAL TOOLKIT\n\n` +
        `Cover: (1) how to research a brand before pitching, (2) a 6-step outreach playbook, (3) pricing yourself — concrete dollar ranges based on follower count tiers, (4) what a counter-offer looks like, (5) 3 outreach email templates the athlete can copy/paste, and (6) red flags to walk away from. Be specific about NIL — not generic 'influencer marketing'.`
      )
    case 'content':
      return (
        intro +
        `Section: CONTENT STRATEGY\n\n` +
        `Build a weekly posting calendar (Mon-Sun) tailored to ${ctx.sport ?? 'their sport'} and their goals. List 30 specific content ideas grouped by category (training, lifestyle, behind-the-scenes, NIL, game day, etc.). Recommend a hashtag strategy — include 3 hashtag stacks they can rotate. Close with 3 'do not post' anti-patterns.`
      )
    case 'growth':
      return (
        intro +
        `Section: GROWTH PLAYBOOK\n\n` +
        `Specific tactics to grow followers and engagement for a ${ctx.sport ?? 'student'} athlete. Cover: collaboration playbook (who to tag, who to DM), engagement bait that actually works in 2026, story stickers + polls that double DMs, when to go live, how to handle haters in comments, and 3 measurable 30-day growth targets.`
      )
    case 'protection':
      return (
        intro +
        `Section: BRAND PROTECTION\n\n` +
        `Cover: (1) logo usage rules — when to use white vs black background, never stretch, minimum size, etc., (2) consistency guidelines — colors, fonts, voice, (3) what NOT to post for a college/NIL athlete (compliance, reputation, scholarship risks), (4) when to take a post down, (5) crisis response template if a post goes wrong.`
      )
    case 'pitch_deck':
      return (
        intro +
        `Section: SPONSOR PITCH TEMPLATE\n\n` +
        `Produce a fill-in-the-blank pitch deck outline a brand can read in 90 seconds. 8 slides: cover, who you are (1 line), reach + engagement, content + audience, why this brand specifically, the proposal, deliverables, ask. Use [BRACKETS] for blanks the athlete fills in. Include a one-paragraph 'TL;DR' opening they can paste in the email body before sending the deck.`
      )
    case 'bio_writer':
      return (
        intro +
        `Section: BIO & CAPTION WRITER\n\n` +
        `Write 3 bios each for Instagram (150 char), TikTok (80 char), and LinkedIn (220 char) — each one with a different angle (athletic resume / personal / fun). Then write 10 caption templates organized by post type: training, game day W, game day L, NIL announcement, off-season, lifestyle, faith/family, recruiting, sponsor shout-out, behind-the-scenes. Use brackets for blanks.`
      )
    case 'email_templates':
      return (
        intro +
        `Section: OUTREACH TEMPLATES\n\n` +
        `Pre-written emails + DMs for: (1) initial brand outreach, (2) follow-up #1 (no response), (3) follow-up #2, (4) post-deal recap email, (5) requesting an introduction, (6) declining a bad offer politely, (7) renegotiation, (8) a slide-into-DMs version for IG. Wrap each in a fenced code block. Use [BRACKETS] for variables.`
      )
    case 'game_day':
      return (
        intro +
        `Section: GAME DAY PLAYBOOK\n\n` +
        `Hour-by-hour content schedule for game day. Pre-game (24h, 12h, 4h, 1h before). During (halftime, key moments). Post-game (win script, loss script, neutral script). For each slot: which platform, what kind of content, sample caption, suggested story stickers. Be specific to ${ctx.sport ?? 'their sport'}.`
      )
    case 'offseason':
      return (
        intro +
        `Section: OFF-SEASON STRATEGY\n\n` +
        `How to stay relevant and grow during the off-season for ${ctx.sport ?? 'their sport'}. Cover: training + transformation content, lifestyle + travel, behind-the-scenes recovery, summer training camps + showcases, charity/community work, content collabs with other athletes, year-end recap content. Give them a month-by-month calendar from end of season to start of next.`
      )
    default:
      return intro + `Section: ${sectionId}\n\nGenerate useful coaching content for a ${ctx.sport ?? 'student'} athlete on this topic.`
  }
}
