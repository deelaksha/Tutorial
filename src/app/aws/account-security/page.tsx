"use client";

import { TopicShell, MemorizeGrid } from "@/components/topic-shell";
import { Section, CodeBlock, Callout, P, IC, Table } from "@/components/ui";
import { AnimatedFlow } from "@/components/animated-flow";

const DIAGRAM = {
  title: "IAM Permission Engine — Live",
  nodes: [
    { id: "dev", icon: "👨‍💻", label: "IAM User", sub: "priya@dev-team", x: 8, y: 50, color: "#22d3ee" },
    { id: "iam", icon: "🔐", label: "IAM", sub: "every call checked", x: 32, y: 50, color: "#fb923c" },
    { id: "policy", icon: "📜", label: "Policy", sub: "JSON allow/deny", x: 55, y: 14, color: "#a78bfa" },
    { id: "role", icon: "🎭", label: "IAM Role", sub: "temporary creds", x: 55, y: 86, color: "#fbbf24" },
    { id: "s3", icon: "🪣", label: "S3 Bucket", sub: "company-data", x: 84, y: 32, color: "#34d399" },
    { id: "ec2", icon: "🖥️", label: "EC2", sub: "prod servers", x: 84, y: 70, color: "#f87171" },
  ],
  edges: [
    { id: "dev-iam", from: "dev", to: "iam", color: "#22d3ee" },
    { id: "iam-policy", from: "iam", to: "policy", dashed: true, color: "#a78bfa" },
    { id: "iam-role", from: "iam", to: "role", dashed: true, color: "#fbbf24" },
    { id: "iam-s3", from: "iam", to: "s3", bend: -18, color: "#34d399" },
    { id: "iam-ec2", from: "iam", to: "ec2", bend: 18, color: "#f87171" },
    { id: "role-s3", from: "role", to: "s3", bend: 30, dashed: true, color: "#fbbf24" },
  ],
  flows: [
    {
      id: "allow",
      name: "✅ Allowed call",
      command: "aws s3 cp report.csv s3://company-data/",
      steps: [
        { node: "dev", paths: ["dev-iam"], text: "Priya runs an AWS CLI command. Her access keys sign the request — it hits IAM before anything else." },
        { node: "iam", paths: ["iam-policy"], text: "IAM gathers EVERY policy attached to her (user + groups) and looks for an explicit Allow on s3:PutObject." },
        { node: "policy", paths: ["iam-s3"], text: "Found: \"Allow s3:PutObject on company-data\". No explicit Deny anywhere → the request proceeds to S3. ✅" },
      ],
    },
    {
      id: "deny",
      name: "⛔ Implicit deny",
      command: "aws ec2 terminate-instances --instance-ids i-prod1",
      steps: [
        { node: "dev", paths: ["dev-iam"], text: "Priya (accidentally!) tries to terminate a production EC2 instance." },
        { node: "policy", paths: ["iam-policy"], text: "IAM scans her policies… no statement mentions ec2:TerminateInstances at all." },
        { node: "iam", paths: ["iam-ec2"], text: "No Allow found = IMPLICIT DENY. AccessDenied (403). In IAM, everything is denied unless explicitly allowed. ⛔" },
      ],
    },
    {
      id: "role",
      name: "🎭 Assume role",
      command: "aws sts assume-role --role-arn arn:aws:iam::PROD:role/auditor",
      steps: [
        { node: "dev", paths: ["dev-iam"], text: "Priya needs read access in the PROD account. She doesn't get keys for it — she asks STS to assume a role." },
        { node: "role", paths: ["iam-role"], text: "The role's trust policy says her account may assume it. STS hands back TEMPORARY credentials (expire in 1 hour)." },
        { node: "s3", paths: ["role-s3"], text: "Using the temp creds she reads the prod bucket. When they expire, access vanishes automatically — nothing to leak. 🎭" },
      ],
    },
  ],
};

const NAV = [
  { id: "account", label: "Your AWS Account" },
  { id: "creating", label: "Creating It Safely" },
  { id: "billing", label: "Billing & Free Tier ⭐" },
  { id: "iam-overview", label: "IAM — The Bouncer ⭐" },
  { id: "users-groups", label: "Users & Groups" },
  { id: "policies", label: "Policies & Permissions ⭐" },
  { id: "roles", label: "Roles — No Passwords ⭐" },
  { id: "mfa-keys", label: "MFA & Access Keys" },
  { id: "best-practices", label: "IAM Best Practices" },
  { id: "memorize", label: "🧠 Memorize This" },
];

export default function AwsAccountSecurityPage() {
  return (
    <TopicShell
      icon="🔐"
      title="Account & IAM"
      gradientWord="IAM"
      subtitle="Day-zero skills: set up an account without surprise bills, then IAM — the service that decides WHO can do WHAT on WHICH resource. Users, groups, roles and policies drawn as one access-control machine."
      nav={NAV}
      badges={["🔑 Access control drawn", "💸 Bill-shock prevention", "💬 Interview-ready"]}
      backHref="/aws"
      backLabel="☁️ AWS"
      next={{ icon: "🖥️", label: "Compute — EC2 & Friends", href: "/aws/compute" }}
    >
      <AnimatedFlow {...DIAGRAM} />

      {/* 01 */}
      <Section id="account" number="01" title="Your AWS Account — What It Actually Is">
        <P>
          An AWS account is a <strong>container with a 12-digit ID</strong> that holds three
          things: your resources, your identities, and your bill. Everything you ever create
          lives inside exactly one account.
        </P>
        <CodeBlock
          title="account_anatomy.txt"
          runnable={false}
          code={`AWS ACCOUNT  (id: 1234-5678-9012)
 ┌───────────────────────────────────────────────┐
 │  👑 ROOT USER (the email you signed up with)  │
 │     unlimited god-mode — use almost NEVER     │
 │                                               │
 │  👥 IAM identities     📦 resources    💳 bill│
 │     users, groups,        EC2, S3,       one  │
 │     roles, policies       VPC, RDS...    bill │
 └───────────────────────────────────────────────┘

 root user  = owns the account  (email + password)
 IAM users  = people/apps you CREATE inside it — use these daily`}
        />
        <Callout type="mistake">
          The <strong>root user</strong> can do literally everything — including deleting the
          account and changing payment details. Daily work on root = driving a tanker truck to
          buy groceries. Lock it away after setup (section 02).
        </Callout>
      </Section>

      {/* 02 */}
      <Section id="creating" number="02" title="Creating an Account — The Safe Checklist">
        <CodeBlock
          title="account_setup_flow.txt"
          runnable={false}
          code={`signup flow (≈10 minutes):

 1️⃣ aws.amazon.com → "Create an AWS Account"
 2️⃣ email + account name        ← becomes the ROOT user
 3️⃣ credit card                 ← required even for Free Tier
 4️⃣ phone verification (OTP)
 5️⃣ pick support plan → "Basic (free)"
        │
        ▼  account is live — NOW immediately:
 ✅ enable MFA on root            (IAM → Security credentials)
 ✅ create an IAM admin user      (daily driver)
 ✅ create a billing alarm        ($5 — emails you before shock)
 ✅ log OUT of root, log IN as admin user
        │
        ▼
 🔒 root credentials → password manager → almost never touched again`}
        />
        <Table
          head={["Root user is ONLY needed for...", "Everything else"]}
          rows={[
            ["changing account email / closing account", "use your IAM admin user"],
            ["changing payment methods", "use your IAM admin user"],
            ["changing support plans", "use your IAM admin user"],
            ["some niche billing/tax settings", "use your IAM admin user"],
          ]}
        />
        <Callout type="tip">
          Interviewers love: &quot;what do you do right after creating an AWS account?&quot; →
          MFA on root, create IAM admin, billing alarm, never use root again.
        </Callout>
      </Section>

      {/* 03 */}
      <Section id="billing" number="03" title="Billing Dashboard & Free Tier — Avoid the Horror Story ⭐">
        <P>
          The <strong>Billing Dashboard</strong> (account menu → Billing) shows month-to-date
          spend, forecasts and per-service costs. Check it weekly while learning. The{" "}
          <strong>Free Tier</strong> gives you a playground — but it has sharp edges:
        </P>
        <Table
          head={["Free Tier type", "Example", "Catch"]}
          rows={[
            ["12 months free", "EC2 t2/t3.micro 750 hrs/mo, S3 5GB, RDS 750 hrs", "clock starts at signup; expires silently"],
            ["Always free", "Lambda 1M requests/mo, DynamoDB 25GB", "limits per month, fine print on extras"],
            ["Trials", "some services 30-90 days", "shortest fuse"],
          ]}
        />
        <CodeBlock
          title="how_bills_explode.txt"
          runnable={false}
          code={`how learners get surprise bills (all true stories):

 💥 launched t3.LARGE not t3.micro      → not free tier, $60/mo
 💥 750 free hrs = ONE micro 24/7       → two instances = 2x hours
 💥 stopped instance, kept EBS volume   → storage still bills
 💥 Elastic IP allocated but NOT in use → ~$3.6/mo each, billed idle
 💥 NAT Gateway left running            → ~$32/mo + data 💸
 💥 forgot a second REGION had stuff    → check the region selector!

 the fix — set this up TODAY:
 Billing → Budgets → "Create budget" → $5/month → email alert ✅`}
        />
        <Callout type="note">
          A <strong>Budget alert</strong> emails you when actual or forecasted spend passes your
          threshold. It cannot STOP the spend — it&apos;s a smoke alarm, not a sprinkler. The
          Cost Optimization topic covers the full toolbox.
        </Callout>
      </Section>

      {/* 04 */}
      <Section id="iam-overview" number="04" title="IAM — The Bouncer at Every Door ⭐">
        <P>
          <strong>IAM (Identity and Access Management)</strong> answers one question for EVERY
          single API call made in your account: <em>is this identity allowed to do this action on
          this resource?</em>
        </P>
        <CodeBlock
          title="iam_decision_flow.txt"
          runnable={false}
          code={`every request (console click, CLI, SDK) goes through this:

 👩 alice runs: aws s3 rm s3://prod-data/backup.zip
        │
        ▼
 ┌─ IAM evaluates ────────────────────────────────────┐
 │ 1. WHO is asking?      → authenticate (alice)      │
 │ 2. explicit DENY?      → yes → ⛔ BLOCKED (always) │
 │ 3. explicit ALLOW?     → yes → ✅ proceed          │
 │ 4. neither?            → ⛔ default DENY           │
 └─────────────────────────────────────────────────────┘

 ⭐ the golden rule:  DENY > ALLOW > (implicit deny)
    everything is forbidden until a policy allows it`}
        />
        <P>The four IAM building blocks you&apos;ll wire together:</P>
        <Table
          head={["Block", "What it is", "Analogy"]}
          rows={[
            [<strong key="u">User</strong>, "a person or app with long-term credentials", "an employee with a badge"],
            [<strong key="g">Group</strong>, "a bag of users; attach policies once", "the 'Developers' department"],
            [<strong key="r">Role</strong>, "an identity anyone authorized can temporarily ASSUME", "a visitor vest you borrow"],
            [<strong key="p">Policy</strong>, "JSON document listing allowed/denied actions", "the rulebook"],
          ]}
        />
        <Callout type="note">
          IAM is <strong>global</strong> — users, roles and policies exist account-wide, not per
          region. And it&apos;s free.
        </Callout>
      </Section>

      {/* 05 */}
      <Section id="users-groups" number="05" title="Users & Groups — People Management That Scales">
        <CodeBlock
          title="users_and_groups.txt"
          runnable={false}
          code={`WITHOUT groups (pain):              WITH groups (sane):

 alice ← policy A, policy B          ┌─ group: developers ─────┐
 bob   ← policy A, policy B          │ 📜 policy A, policy B   │
 carol ← policy A, policy B          │ 👩 alice 👨 bob 👩 carol │
 dave  ← policy A, policy B          └─────────────────────────┘
                                     ┌─ group: admins ─────────┐
 new hire? attach 2 policies         │ 📜 AdministratorAccess  │
 policy change? edit 4 users 😩      │ 👨 dave                 │
                                     └─────────────────────────┘
                                     new hire? add to group ✅
                                     policy change? edit group ✅`}
        />
        <Table
          head={["Fact", "Detail"]}
          rows={[
            ["A user can be in", "multiple groups (permissions add up)"],
            ["Groups can contain", "users only — NOT other groups"],
            ["A user's permissions =", "all group policies + their own attached policies"],
            ["Console login", "username + password (+ MFA)"],
            ["CLI/SDK login", "access keys (section 08)"],
          ]}
        />
        <Callout type="tip">
          Real organizations barely use IAM users anymore — they federate through{" "}
          <strong>IAM Identity Center</strong> (SSO with Google/AD login). But users + groups
          remain the model you must understand first, and what every exam asks.
        </Callout>
      </Section>

      {/* 06 */}
      <Section id="policies" number="06" title="Policies — The JSON That Rules Everything ⭐">
        <P>
          A policy is a JSON document. Learn to read its 4 keywords and you can audit any AWS
          permission in existence:
        </P>
        <CodeBlock
          title="policy_anatomy.json"
          runnable={false}
          code={`{
  "Version": "2012-10-17",            ← always this date (schema version)
  "Statement": [
    {
      "Sid": "AllowReadOnProdBucket", ← optional label
      "Effect": "Allow",              ← Allow or Deny
      "Action": [                     ← WHICH API calls
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [                   ← ON WHICH resources (ARNs)
        "arn:aws:s3:::prod-data",
        "arn:aws:s3:::prod-data/*"
      ],
      "Condition": {                  ← optional: only WHEN
        "IpAddress": { "aws:SourceIp": "203.0.113.0/24" }
      }
    }
  ]
}

read it aloud: "ALLOW s3 GetObject/ListBucket ON prod-data,
                but only from the office IP range"`}
        />
        <Table
          head={["Policy flavor", "What", "Use"]}
          rows={[
            ["AWS managed", "written & updated by AWS (e.g. AmazonS3ReadOnlyAccess)", "quick start, common jobs"],
            ["Customer managed", "you write it, reusable across identities", "production — precise control"],
            ["Inline", "glued to ONE identity, not reusable", "rare one-off exceptions"],
          ]}
        />
        <CodeBlock
          title="arn_format.txt"
          runnable={false}
          code={`ARN — Amazon Resource Name (how policies point at things):

 arn:aws:s3:::prod-data/backup.zip
 arn:aws:ec2:us-east-1:123456789012:instance/i-0abc123
  │   │   │       │          │            │
  └arn └aws └service └region   └account-id  └resource

 (global services like S3 leave region/account blank)
 "Resource": "*"  = every resource — handle with care 🔥`}
        />
        <Callout type="mistake">
          <IC>&quot;Action&quot;: &quot;*&quot;, &quot;Resource&quot;: &quot;*&quot;</IC> = full
          admin. Copy-pasting this from Stack Overflow &quot;to make the error go away&quot; is
          how breaches start. Grant the minimum that works (section 09).
        </Callout>
      </Section>

      {/* 07 */}
      <Section id="roles" number="07" title="Roles — Permissions Without Passwords ⭐">
        <P>
          The concept beginners struggle with most, and the one AWS uses everywhere. A{" "}
          <strong>role</strong> is an identity with policies — but <em>no password and no keys</em>.
          Trusted entities <strong>assume</strong> it and receive temporary credentials that
          auto-expire:
        </P>
        <CodeBlock
          title="role_in_action.txt"
          runnable={false}
          code={`THE WRONG WAY (keys on the server 💀):       THE RIGHT WAY (role):

 ┌─ EC2 instance ──────────┐           ┌─ EC2 instance ─────────────┐
 │ app needs S3 access     │           │ role attached:             │
 │ → paste access keys     │           │   "s3-reader-role" 🎭      │
 │   into config file 😱   │           │ → app asks instance        │
 │ keys never expire,      │           │   metadata for creds       │
 │ leak via git/backup...  │           │ → gets TEMPORARY keys,     │
 └─────────────────────────┘           │   auto-rotated by AWS ✅   │
                                       └────────────────────────────┘

 a role has TWO policies:
 1. permissions policy → WHAT it can do      (e.g. read S3)
 2. trust policy       → WHO may assume it   (e.g. ec2.amazonaws.com)`}
        />
        <Table
          head={["Who assumes a role?", "Example"]}
          rows={[
            ["AWS services", "EC2 reads S3, Lambda writes DynamoDB — THE standard pattern"],
            ["Users (temporarily)", "dev assumes 'prod-admin' role for 1 hour, audited"],
            ["Other AWS accounts", "Account B's auditor reads Account A's logs — no shared keys"],
            ["Federated identities", "login with Google/AD → mapped to a role"],
          ]}
        />
        <Callout type="analogy">
          🎭 A role is a <strong>valet vest</strong>. While wearing it, anyone authorized can park
          cars. Take it off and the power is gone. Nobody carries a personal &quot;car-parking
          password&quot; that could leak.
        </Callout>
        <Callout type="tip">
          Exam keyword-matching: &quot;EC2/Lambda needs to access another service&quot; →{" "}
          <strong>role</strong>. &quot;cross-account access&quot; → <strong>role</strong>.
          &quot;temporary credentials&quot; → <strong>role</strong>. Never access keys on servers.
        </Callout>
      </Section>

      {/* 08 */}
      <Section id="mfa-keys" number="08" title="MFA, Access Keys & Password Policies">
        <CodeBlock
          title="credentials_map.txt"
          runnable={false}
          code={`the 3 credential types and where they belong:

 1️⃣ PASSWORD          → humans in the web CONSOLE
     + password policy: min length, complexity, rotation, no reuse
 2️⃣ MFA               → second factor on top of the password
     password (something you KNOW) + device (something you HAVE)
     phishing steals your password → login still fails ✅
     types: 🔢 authenticator app (TOTP) · 🔑 FIDO2 key · 🔒 hardware
 3️⃣ ACCESS KEYS       → code/CLI, NOT humans
     AKIAIOSFODNN7EXAMPLE      ← Access Key ID  ("username")
     wJalrXUtnFEMI/K7MDENG...  ← Secret Key     ("password", shown ONCE)

 $ aws configure        ← stores keys in ~/.aws/credentials
 $ aws s3 ls            ← CLI signs requests with them`}
        />
        <Table
          head={["Rule", "Why"]}
          rows={[
            ["MFA on root: mandatory", "root + leaked password = account gone"],
            ["MFA on every human: yes", "passwords leak constantly"],
            ["Access keys in code/git: NEVER", "bots scan GitHub for AKIA... within minutes"],
            ["Keys on EC2/Lambda: NEVER", "that's what roles are for"],
            ["Rotate keys you must keep", "limits blast radius of a silent leak"],
          ]}
        />
        <Callout type="behind">
          Leaked-key attacks are automated: bots scrape public GitHub commits for the{" "}
          <IC>AKIA</IC> prefix and spin up crypto-mining EC2 fleets within minutes — the classic
          $50k-overnight-bill story. AWS often detects and emails you, but the bill is yours
          (shared responsibility!).
        </Callout>
      </Section>

      {/* 09 */}
      <Section id="best-practices" number="09" title="IAM Best Practices — The Checklist">
        <CodeBlock
          title="least_privilege.txt"
          runnable={false}
          code={`LEAST PRIVILEGE — the one principle behind every rule:

 ❌ "give admin so it works,        ✅ "grant ONLY what the job
     tighten later" (never happens)     needs, expand on demand"

 app uploads images to one bucket:
 ❌ AdministratorAccess              ✅ s3:PutObject on
                                        arn:aws:s3:::img-bucket/*`}
        />
        <Table
          head={["✅ Do", "Why"]}
          rows={[
            ["Lock away root + MFA", "use it ~once a year"],
            ["One IAM user per person", "no shared logins — audit trails need names"],
            ["Permissions via groups", "manageable at scale"],
            ["Roles for services & cross-account", "no long-lived keys on machines"],
            ["Least privilege always", "small blast radius"],
            ["MFA for all humans", "passwords WILL leak"],
            ["Rotate/remove unused credentials", "old keys are silent time bombs"],
            ["Review with IAM Access Analyzer / credential report", "find what's over-permissioned"],
          ]}
        />
        <Callout type="tip">
          Asked &quot;how do you secure an AWS account?&quot; — walk this exact list from root
          MFA to least privilege. It maps one-to-one to AWS&apos;s official best practices page.
        </Callout>
      </Section>

      {/* 10 */}
      <Section id="memorize" number="10" title="🧠 Memorize This">
        <MemorizeGrid
          items={[
            ["Root user", "god-mode email login — MFA it, then never use it"],
            ["First 4 steps", "root MFA → IAM admin → billing alarm → log out of root"],
            ["Free tier trap", "750 hrs = ONE micro 24/7; watch EBS, EIP, NAT"],
            ["IAM evaluation", "explicit DENY > ALLOW > default deny"],
            ["User", "long-term identity for a person/app"],
            ["Group", "bag of users — attach policies here"],
            ["Role", "assumable identity, temporary creds, no password"],
            ["Policy", "JSON: Effect + Action + Resource (+ Condition)"],
            ["EC2 → S3 access", "attach a ROLE — never paste keys"],
            ["Access keys", "CLI/SDK only; never in git; rotate"],
            ["MFA", "know (password) + have (device)"],
            ["Golden principle", "least privilege — minimum that works"],
          ]}
        />
      </Section>
    </TopicShell>
  );
}
