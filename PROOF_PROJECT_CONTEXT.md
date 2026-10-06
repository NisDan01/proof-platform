# PROOF PROJECT — DEVELOPMENT CONTEXT

## PROJECT
Name: PROOF
Tagline: Don't just apply. Prove yourself.

PROOF is a skill-to-opportunity platform where candidates prove skills through practical challenges before applying to jobs/projects.

Core flow:
Candidate → Challenge → Score → Skill Passport → Opportunity → Company Challenge → Shortlist → Interview → Hire

Initial skills:
- AI Evaluation
- Prompt Engineering
- Python
- Data Analysis

## TECH STACK
- Next.js 16.3.8
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase
- @supabase/supabase-js
- @supabase/ssr
- Git/GitHub
- Vercel later

Project:
~/proof-platform

Run:
npm run dev

Local:
http://localhost:3000

IMPORTANT:
- Never expose .env.local
- Never expose Supabase secret key
- Never expose OAuth secrets/tokens
- Do not run npm audit fix --force without checking first

## MAIN FILES

app/page.tsx
app/globals.css
app/dashboard/page.tsx
app/auth/page.tsx
app/auth/callback/route.ts
app/applications/page.tsx
app/challenges/page.tsx
app/challenges/[id]/page.tsx
app/challenges/[id]/result/page.tsx
app/company/page.tsx
app/company/candidates/[id]/page.tsx
app/company/challenges/new/page.tsx
app/company/opportunities/new/page.tsx
app/messages/page.tsx
app/notifications/page.tsx
app/opportunities/page.tsx
app/opportunities/[id]/page.tsx
app/passport/page.tsx
app/hiring-challenges/[id]/page.tsx
app/hiring-challenges/[id]/result/page.tsx
app/history/page.tsx

components/Navbar.tsx

lib/matching.ts
lib/supabase/client.ts
lib/supabase/server.ts

## AUTH

Supabase email/password authentication is implemented.

Google OAuth is implemented.

Callback:
http://localhost:3000/auth/callback

Supabase base URL:
https://kiosebuajyvqnijdppap.supabase.co

.env.local contains:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

.env.local is ignored by Git.

## PROFILES

public.profiles contains:
- id
- full_name
- username
- avatar_url
- role
- created_at
- updated_at

New users get profiles through a database trigger.

## SKILL PASSPORT

Tables:
public.skills
public.user_skills

Current skills:
- AI Evaluation
- Prompt Engineering
- Python
- Data Analysis

Current user skill data:
- AI Evaluation: 87, verified
- Prompt Engineering: 89, verified
- Python: 74
- Data Analysis: 81

## MESSAGING DATABASE

Tables:
public.conversations
public.messages

IMPORTANT:

conversations.company_id references:

public.companies(id)

NOT profiles(id).

conversations:
- id
- candidate_id → profiles.id
- company_id → companies.id
- created_at
- updated_at

Unique:
candidate_id + company_id

messages:
- id
- conversation_id
- sender_id
- message
- is_read
- created_at

Company ownership is through:

companies.owner_id

Therefore company access must check:

companies.owner_id = auth.uid()

Do NOT compare:

auth.uid() = conversations.company_id

because company_id is companies.id.

## MESSAGING UI

Current file:

app/messages/page.tsx

Latest UI:
- Dashboard-style left sidebar
- Messages selected
- Overview
- Challenges
- Opportunities
- Skill Passport
- Applications
- Messages
- Notifications
- Saved
- Profile
- Settings
- Sign out
- Conversation list
- Chat window
- Send message
- Mobile Back button

Messages should behave like Dashboard navigation.

## COMPANY CANDIDATE PAGE

Current file:

app/company/candidates/[id]/page.tsx

Contains:
- candidate profile
- skills
- challenge attempts
- hiring challenge attempts
- application
- match score
- recruiter notes
- messaging

Company ID and profile/owner ID are different.

Example previously observed:

company id:
bb96780e-2244-4507-bfac-39bbf5f5a038

owner/profile id:
3569b8fd-4c9b-47f8-9730-8c3a54ec305f

Never assume company.id = profile.id.

## MESSAGING RLS

Candidate access:
auth.uid() = conversations.candidate_id

Company access:
exists (
  select 1
  from public.companies co
  where co.id = conversations.company_id
  and co.owner_id = auth.uid()
)

Messages should use the same participant logic through conversations.

If permission errors appear, check:
- GRANT permissions
- conversations RLS
- messages RLS
- companies.owner_id

## DASHBOARD

app/dashboard/page.tsx

Navigation:
- Overview
- Challenges
- Opportunities
- Skill Passport
- Applications
- Messages
- Notifications
- Saved
- Profile
- Settings

Dashboard is dark, futuristic and responsive.

A previous white grid/background issue was fixed.

Do not reintroduce the white grid.

## LANDING PAGE

app/page.tsx

Current design:
- dark futuristic
- colorful gradients
- glass cards
- smooth animations
- responsive
- premium UI

Hero:
Skills speak louder than resumes.

Demo statistics:
12K+ Skills verified
3.8K+ Challenges completed
420+ Opportunities

These are demo values and must eventually come from real database data.

## CHALLENGES

Current demo challenges:

AI Evaluation:
Find the better AI response
Intermediate
8 min
100 XP

Python:
Debug a real data pipeline
Intermediate
15 min
150 XP

Prompt Engineering:
Break the model. Improve the prompt.
Advanced
12 min
200 XP

AI Evaluation should test:
- factual accuracy
- relevance
- clarity
- reasoning
- hallucination
- major/minor issues
- better response selection
- explanation quality

## COMPANY FLOW

Company dashboard
→ Create Opportunity
→ Create Hiring Challenge
→ View Candidates
→ Candidate Profile
→ Shortlist
→ Interview
→ Hire

## MATCHING

lib/matching.ts exists.

Purpose:
Match candidate skills against opportunity requirements.

## DESIGN

PROOF should feel:
- futuristic
- premium
- dark
- colorful
- modern
- smooth
- responsive
- fast

Performance matters.

Prefer:
- transform/opacity animations
- reusable components
- lazy loading where useful
- reduced-motion support
- clean architecture

Do not add unnecessary code just to increase line count.

## USER CODING PREFERENCE

User prefers:
- Terminal commands that automatically create/update files
- Minimal manual VS Code editing
- Simple Hinglish
- Short explanations
- Exact commands to copy/paste
- If something fails, ask for the exact Terminal/browser error

## GIT

Current branch:
main

Latest commit:
ebc03b0

Commit message:
Finish today's messaging updates

Latest confirmed state before context-file creation:
nothing to commit, working tree clean

The context file itself is intentionally not part of the application code.

## TODAY'S COMPLETED WORK

1. PROOF landing page
2. Dashboard
3. Supabase setup
4. Email/password authentication
5. Google OAuth
6. Profiles
7. Skill Passport
8. Company/candidate structure
9. Messaging database
10. Messaging permissions
11. Company ID foreign-key correction
12. Candidate/company messaging
13. Dashboard-style Messages page
14. Mobile Messages navigation
15. Messaging UI improvements

## NEXT SESSION

Start with:

cd ~/proof-platform
git status

Then:

npm run dev

Open:

http://localhost:3000/messages

Test:
- sidebar
- Messages selected
- conversation list
- open conversation
- send message
- mobile Back button
- candidate/company messaging

If permission error:
Fix conversations/messages RLS using companies.owner_id.

If companies column error:
Inspect actual companies table columns before changing the frontend.

Do NOT rebuild working features unnecessarily.

Continue from the existing project.

## IMPORTANT FOR NEW CHATGPT CHAT

This is an EXISTING project.

Do NOT start PROOF from scratch.

When this file is uploaded, understand the current architecture, database, messaging implementation, Git state and completed work.

Then continue from the current state.

First response:
"Got it. I have the PROOF project context. We can continue from the current state."
