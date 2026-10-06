# PROOF — PROJECT CONTEXT / HANDOVER

## PROJECT
Name: PROOF
Tagline: Don’t just apply. Prove yourself.

PROOF is a proof-first skill-to-opportunity platform.
Core idea:

Candidate → Skill Challenge → Score → Skill Passport → Opportunities → Application → Company Review → Interview → Hire

Main goal:
Build a serious, premium, futuristic hiring platform where candidates prove skills through practical evidence instead of only submitting a CV.

---

## TECH STACK

- Next.js 16.3.8
- TypeScript
- React
- Tailwind CSS
- Framer Motion
- Supabase
- PostgreSQL
- Supabase Auth
- Vercel planned
- Lucide / modern icons as needed
- Recharts planned
- Git / GitHub

Project directory:

~/proof-platform

Important:
This project uses `app/`, NOT `src/app/`.

Environment:
.env.local exists and contains Supabase credentials.
NEVER put secrets/API keys in this context file or GitHub.

---

## CURRENT PRODUCT DIRECTION

PROOF should NOT feel like another LinkedIn clone.

Core differentiator:
"Proof before claims."

Candidates:
- Create profile
- Build Skill Passport
- Take practical challenges
- Receive scores
- Get verified skills
- Apply to opportunities
- Track application status
- Receive application notifications

Companies:
- Create company
- Post opportunities
- Define required skills and minimum scores
- Receive applications
- See candidate match scores
- View candidate proof
- Change application status
- Shortlist / interview / hire

Future:
- AI-powered evaluation
- Advanced anti-cheating
- Company verification
- Scam/fake job detection
- Leaderboards
- XP
- Streaks
- Shareable proof
- Payments
- Analytics
- Mobile app

---

# CURRENT ROUTES

/
Landing page

/auth
Login / signup / Google OAuth

/dashboard
Candidate dashboard

/passport
Candidate Skill Passport

/history
Challenge history

/challenges
Challenge listing

/challenges/[id]
Challenge assessment

/challenges/[id]/result
Challenge result

/opportunities
Opportunity listing

/opportunities/[id]
Opportunity detail + PROOF Match + Apply

/applications
Candidate application tracking

/company
Company dashboard

/company/opportunities/new
Create opportunity

/company/candidates/[id]
Candidate profile / recruiter view

---

# HOMEPAGE STATUS

Homepage is already considered PREMIUM.

DO NOT redesign homepage unless specifically requested.

It contains:
- dark futuristic background
- cyan/violet gradients
- animated glows
- particles
- animated hero
- gradient text
- Skill Passport preview
- animated skill bars
- challenge cards
- opportunity section
- scroll reveals
- CTA
- footer
- animated movement

User specifically wants:
"bht jyada animations chiye like movements"

But animation must remain:
- smooth
- fast
- GPU-friendly
- responsive
- not excessive in a way that hurts performance

---

# NAVBAR

components/Navbar.tsx

Current navigation:
- PROOF
- Challenges
- Opportunities
- Skill Passport
- Sign in
- Get started

Potential future improvement:
Skill Passport navigation should point to /passport rather than only an anchor if needed.

---

# SUPABASE

Supabase project:
Proof-platform
Project:
proof-platform

Region:
Asia-Pacific

Supabase URL is stored in .env.local.

Client:
lib/supabase/client.ts

Server:
lib/supabase/server.ts

Uses @supabase/ssr.

---

# AUTHENTICATION

Email/password authentication implemented.

Google OAuth implemented.

Auth route:
app/auth/page.tsx

Callback:
app/auth/callback/route.ts

Successful authentication redirects to:
/dashboard

Signup stores full_name.

Google metadata is used to create/update profile.

---

# PROFILES TABLE

public.profiles

Columns:

id uuid primary key references auth.users(id)
full_name text
username text unique
avatar_url text
role text default 'candidate'
created_at timestamptz
updated_at timestamptz

RLS:
Users can view/update/insert their own profile.

Recruiters can view profiles of candidates who applied to their opportunities.

---

# SKILLS

public.skills

Seeded skills:

1. AI Evaluation
Description:
Evaluate AI responses for accuracy, relevance, clarity and reasoning.

2. Prompt Engineering
Description:
Design and improve prompts to produce better AI responses.

3. Python
Description:
Python programming, debugging and data processing.

4. Data Analysis
Description:
Analyze structured data and generate useful insights.

---

# USER SKILLS

public.user_skills

Columns:
id
user_id
skill_id
score
verified
created_at
updated_at

Current demo/user evidence:

Prompt Engineering = 89 verified
AI Evaluation = 100 verified
Data Analysis = 81
Python = 74

Current total:
4 skills

Verified:
2

Average:
86

---

# CHALLENGE SYSTEM

Tables:

public.challenges
public.challenge_questions
public.challenge_attempts
public.challenge_answers

Challenge supports:
- multiple choice
- text
- points
- difficulty
- duration
- XP
- published status

Current flagship challenge:

AI Response Evaluation

Description:
Compare AI responses and identify which answer is more accurate, relevant and useful.

Difficulty:
Intermediate

Duration:
8 minutes

XP:
100

Questions:
5

Current questions test:
1. factual correctness
2. relevance
3. hallucination
4. answer quality
5. clarity

---

# CHALLENGE FLOW

/challenges
→ select challenge

/challenges/[id]
→ timer
→ one question at a time
→ progress
→ answer selection
→ previous/next
→ submit

/challenges/[id]/result
→ score
→ percentage
→ XP
→ pass/fail
→ links to passport/challenges/dashboard

Passing score:
70%

---

# CHALLENGE RESULTS

Current attempts:

Attempt 1:
50 / 50
100%
100 XP
completed

Attempt 2:
10 / 50
20%
20 XP
completed

Total XP:
120

Best score:
100%

---

# SKILL UPDATE RPC

Function:

public.update_skill_from_challenge(p_attempt_id uuid)

Purpose:
After a challenge, update the candidate's skill score.

Rules:
- score percentage calculated from attempt
- verified when score >= 70
- existing best score is preserved
- verified status is preserved

---

# SKILL PASSPORT

Route:
/passport

Shows:
- Verified Identity
- Candidate Skill Passport
- Total skills
- Verified skills
- Average score
- Individual evidence cards
- Score bars
- Verified badges
- Last updated date
- Take another challenge

Current evidence:

AI Evaluation:
100 — Verified

Prompt Engineering:
89 — Verified

Python:
74

Data Analysis:
81

---

# CHALLENGE HISTORY

Route:
/history

Shows:
- completed challenges
- score
- percentage
- XP
- best score
- attempt history

Current:
2 completed attempts
120 XP
100% best score

---

# OPPORTUNITIES

Tables:

public.opportunities
public.opportunity_skills

Opportunity fields:

id
title
company_name
description
opportunity_type
location
remote
salary_min
salary_max
currency
status
created_at
company_id

Types:
Job
Project
Internship
Challenge

Statuses:
draft
open
closed

---

# DEMO OPPORTUNITIES

These are demo data, NOT real companies.

1.
AI Response Evaluator
Demo AI Labs
Job
Remote
₹400,000–700,000

2.
Junior Data Analyst
Demo Systems
Job
India / Remote
₹350,000–600,000

3.
Prompt Engineering Intern
Demo Future AI
Internship
Remote
₹15,000–30,000

Do not represent these demo companies as real employers.

---

# OPPORTUNITY MATCHING

File:

lib/matching.ts

Purpose:
Calculate candidate compatibility against opportunity requirements.

CandidateSkill:
skill_id
score
verified

RequiredSkill:
skill_id
required_score

Matching logic:
- candidate score compared with required score
- score ratio capped at 1
- verified skill gets bonus
- final score converted to percentage

Labels:

90+:
Excellent match

75+:
Strong match

60+:
Good match

40+:
Partial match

below 40:
Low match

---

# OPPORTUNITY DETAIL

Route:
/opportunities/[id]

Features:
- opportunity information
- required skills
- candidate skills
- PROOF Match score
- required minimum score
- candidate score
- verified status
- Apply button
- application state

---

# APPLICATIONS

Table:

public.applications

Fields:

id
opportunity_id
user_id
status
created_at
updated_at

Statuses:

applied
reviewing
shortlisted
interview
rejected
hired

Unique:
one application per opportunity per user.

Candidate can:
- view own applications
- apply

Company can:
- view applications for own opportunities
- update status through secure RPC

---

# APPLICATION UI

Route:
/applications

Pipeline:

Applied
↓
Reviewing
↓
Shortlisted
↓
Interview
↓
Hired

Rejected:
Not selected

Each application shows:
- opportunity
- company
- type
- remote/location
- current status
- updated date

---

# APPLICATION STATUS RPC

Function:

public.update_application_status(
p_application_id uuid,
p_status text
)

Important:
Company ownership is checked inside the RPC.

Valid statuses:

applied
reviewing
shortlisted
interview
rejected
hired

It updates:
status
updated_at

LATEST VERSION ALSO CREATES NOTIFICATION FOR THE CANDIDATE.

The latest SQL function should:
1. Verify company owner
2. Find candidate
3. Find opportunity title
4. Convert status to human-readable label
5. Update application
6. Insert notification

---

# NOTIFICATIONS

Table:

public.notifications

Fields:

id uuid
user_id uuid
application_id uuid nullable
type text
title text
message text
read boolean
created_at timestamptz

RLS:
Candidate can view own notifications.
Candidate can update own notifications.

Grant:
select/update to authenticated.

Purpose:
When recruiter changes application status, candidate gets notification.

CURRENT STATE:
Notifications database table is DONE.

Latest RPC notification update was just provided and should be considered the next database step if it has not yet been executed.

After executing it, next frontend task is:
Candidate dashboard notification UI / notification list / unread count / mark as read.

---

# COMPANIES

Table:

public.companies

Fields:

id
owner_id
name
description
website
logo_url
verified
created_at

Company owner can:
- create company
- view own company
- update own company

Demo companies:

Demo AI Labs
Demo Systems
Demo Future AI

These are demo companies only.

---

# COMPANY OPPORTUNITIES

opportunities now has:

company_id uuid
references public.companies(id)

Company owner can:
- create opportunity
- update opportunity
- view own opportunities

---

# COMPANY DASHBOARD

Route:
/company

Features:

- premium hiring dashboard
- open opportunities
- applications
- review queue
- shortlisted
- hired
- recent application pipeline
- status selector
- hiring funnel
- active hiring cards
- PROOF advantage section
- top candidate matches

---

# TOP CANDIDATE MATCHES

Company dashboard calculates candidate compatibility using:

lib/matching.ts

It fetches:
- applicant IDs
- candidate skills
- required opportunity skills
- candidate profiles

Candidates are ranked by match score.

Shows:
- candidate name
- match percentage
- match label
- skill compatibility bar
- View proof

Candidate names are fetched from profiles.

---

# CANDIDATE PROFILE FOR RECRUITERS

Route:

/company/candidates/[id]

Shows:

- candidate name
- verified badge
- overall average score
- verified skills
- completed challenges
- XP
- Skill Passport
- challenge evidence
- PROOF Match score
- required skill comparison
- meets/below requirement
- verified evidence

Recruiter access is protected by RLS.

Recruiters can view:
- candidate profile
- candidate skills
- candidate challenge attempts

Only for candidates who applied to their opportunities.

---

# COMPANY CREATE OPPORTUNITY

Route:

/company/opportunities/new

Features:

- title
- description
- type
- location
- remote
- salary
- required skills

Required skills can have minimum score.

Current default minimum:
70 / 100

Allowed minimum:
50–100

Selected skill scores are saved in:

public.opportunity_skills

---

# IMPORTANT SECURITY

Never expose:
- Supabase secret/service role key
- OAuth client secret
- private credentials
- access tokens

.env.local is ignored by Git.

Check with:

git check-ignore -v .env.local

Do not commit .env.local.

---

# CURRENT IMPORTANT FILES

app/page.tsx
app/auth/page.tsx
app/auth/callback/route.ts
app/dashboard/page.tsx
app/passport/page.tsx
app/history/page.tsx
app/challenges/page.tsx
app/challenges/[id]/page.tsx
app/challenges/[id]/result/page.tsx
app/opportunities/page.tsx
app/opportunities/[id]/page.tsx
app/applications/page.tsx
app/company/page.tsx
app/company/opportunities/new/page.tsx
app/company/candidates/[id]/page.tsx

components/Navbar.tsx

lib/matching.ts
lib/supabase/client.ts
lib/supabase/server.ts

---

# DEVELOPMENT COMMANDS

Start development server:

npm run dev

TypeScript check:

npx tsc --noEmit

Project:

cd ~/proof-platform

Local site:

http://localhost:3000

---

# CURRENT DEVELOPMENT STATUS

DONE:

✓ Next.js project
✓ Premium homepage
✓ Navbar
✓ Framer Motion
✓ Supabase connection
✓ Email/password auth
✓ Google auth
✓ Profiles
✓ Skills
✓ User skills
✓ Challenge database
✓ Challenge UI
✓ Challenge timer
✓ Challenge scoring
✓ Challenge result
✓ Skill update RPC
✓ Skill Passport
✓ Challenge history
✓ Opportunities
✓ Opportunity detail
✓ Applications
✓ Application status pipeline
✓ Secure recruiter status RPC
✓ Company database
✓ Company dashboard
✓ Company opportunity creation
✓ Required skill score
✓ Matching engine
✓ Candidate match ranking
✓ Recruiter candidate profile
✓ Recruiter RLS
✓ Notifications database
✓ Notification RLS

---

# IMMEDIATE NEXT STEP

After the latest notification RPC is executed and confirmed:

BUILD CANDIDATE NOTIFICATIONS UI.

Recommended:

Dashboard:
- notification bell
- unread count
- recent notification dropdown/card

Possible dedicated route later:
/notifications

Functionality:
- fetch notifications for current user
- unread notifications highlighted
- mark notification read
- mark all read
- show application status updates
- link notification to relevant application

Do NOT build everything at once.
Work one exact step at a time.

---

# FUTURE ROADMAP

Next major systems:

1. Notifications frontend
2. Opportunity saved/bookmarked system
3. Candidate dashboard improvements
4. Company verification
5. Company challenge creation
6. Candidate-specific company challenges
7. Interview scheduling
8. Hiring workflow
9. Anti-cheating / challenge integrity
10. Admin dashboard
11. Reports / abuse
12. Leaderboards
13. XP / streak system
14. Shareable Skill Passport
15. AI evaluation engine
16. AI-powered candidate matching
17. Email notifications
18. Analytics
19. Payments
20. Mobile app after web traction

---

# PRODUCT PRINCIPLES

PROOF should feel:

- Premium
- Futuristic
- Trustworthy
- Fast
- Professional
- Colorful
- Highly animated
- Evidence-driven
- Not like LinkedIn
- Not like a generic job board

Animation preference:
User wants lots of movement and polished transitions.

But:
- don't sacrifice performance
- avoid unnecessary huge components
- use Framer Motion intelligently
- prefer transform/opacity animations
- lazy load heavy content
- maintain responsive design

---

# USER CODING PREFERENCE

IMPORTANT:

User wants Terminal-first development.

Do NOT tell user:
"open the file and manually edit this part"

Prefer:
- exact terminal command
- complete file replacement using heredoc
- one step at a time

User usually says:
"ab next"
or
"done"

When user says done:
Proceed to the next logical implementation step.

Do not dump 10 steps at once.

---

# DEBUGGING RULE

After meaningful code changes:

npx tsc --noEmit

If successful:
continue.

If errors:
fix through Terminal.

Do not use npm audit fix --force unless specifically necessary.

Do not randomly upgrade dependencies.

---

# UI RULE

User prefers:
- dark futuristic UI
- cyan/violet gradients
- glass cards
- premium spacing
- animated backgrounds
- smooth hover
- animated progress bars
- modern typography

Do not make UI plain/basic unless functionality requires it.

---

# IMPORTANT DEMO DATA RULE

Demo AI Labs
Demo Systems
Demo Future AI

are fictional/demo data.

Never describe them as actual companies.

---

# CHAT HANDOVER INSTRUCTION

If this file is given to a new ChatGPT conversation:

FIRST:
Read this entire file.

THEN:
Understand the current project architecture and database.

THEN:
Ask only if something is genuinely missing.

Otherwise continue from:
"IMMEDIATE NEXT STEP"

Do not restart the project.
Do not recreate completed features.
Do not redesign completed homepage unnecessarily.
Do not replace working architecture without a reason.

The user wants to continue building PROOF, not start over.

---

# END
