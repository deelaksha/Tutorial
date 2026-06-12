"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Category = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  meta: string;
  href: string;
  available: boolean;
};

type Group = { title: string; emoji: string; items: Category[] };

const GROUPS: Group[] = [
  {
    title: "Foundations",
    emoji: "🌱",
    items: [
      { id: "fundamentals", icon: "☁️", name: "Cloud Computing Fundamentals", desc: "What the cloud ACTUALLY is, on-premises vs cloud drawn rack by rack, IaaS / PaaS / SaaS as a pizza, Regions → AZs → Edge locations, and the Shared Responsibility line.", meta: "10 sections · start here ⭐", href: "/aws/fundamentals", available: true },
      { id: "account-security", icon: "🔐", name: "AWS Account & IAM", desc: "Create an account safely, the billing dashboard, Free Tier traps, then IAM end to end: users, groups, roles, policies, MFA, access keys — who can do what, drawn.", meta: "10 sections · do this first ⭐", href: "/aws/account-security", available: true },
    ],
  },
  {
    title: "Core Services",
    emoji: "🧱",
    items: [
      { id: "compute", icon: "🖥️", name: "Compute — EC2 & Friends", desc: "Launch an EC2 instance step by step: AMI → instance type → key pair → security group → user data. Plus Lambda, ECS, EKS, Fargate, Beanstalk and Batch compared.", meta: "11 sections · the workhorse ⭐", href: "/aws/compute", available: true },
      { id: "storage", icon: "🪣", name: "Storage — S3 & the Family", desc: "Buckets, objects, versioning, lifecycle rules, storage classes drawn as a temperature scale, static website hosting, replication — plus EBS vs EFS vs FSx vs Snow.", meta: "10 sections · S3 deep dive ⭐", href: "/aws/storage", available: true },
      { id: "databases", icon: "🗄️", name: "Databases — RDS to DynamoDB", desc: "Relational (RDS, Aurora) vs NoSQL (DynamoDB) decided with a flowchart, Multi-AZ vs read replicas drawn, plus Redshift, ElastiCache, Neptune, DocumentDB.", meta: "9 sections · pick the right DB", href: "/aws/databases", available: true },
    ],
  },
  {
    title: "Networking & Content Delivery",
    emoji: "🌐",
    items: [
      { id: "networking", icon: "🕸️", name: "VPC — Your Private Network", desc: "THE most important AWS topic: CIDR blocks, public vs private subnets, route tables, Internet Gateway vs NAT Gateway, NACLs vs Security Groups — one network built box by box.", meta: "11 sections · most important ⭐", href: "/aws/networking", available: true },
      { id: "dns-cdn", icon: "📡", name: "Route 53 & CloudFront", desc: "How DNS resolves your domain step by step, hosted zones, record types, routing policies — then CloudFront edge caching drawn across the globe, plus VPN & Direct Connect.", meta: "9 sections · traffic in", href: "/aws/dns-cdn", available: true },
      { id: "load-balancing", icon: "⚖️", name: "Load Balancing & Auto Scaling", desc: "ALB vs NLB vs GWLB decided with a flowchart, target groups, health checks, then Auto Scaling: dynamic, predictive and scheduled policies reacting to real traffic.", meta: "9 sections · elasticity ⭐", href: "/aws/load-balancing", available: true },
    ],
  },
  {
    title: "Operations & Security",
    emoji: "🛡️",
    items: [
      { id: "monitoring", icon: "📊", name: "CloudWatch, CloudTrail & Config", desc: "Metrics, logs, alarms and dashboards — the full observability loop drawn. WHO did WHAT with CloudTrail, WHAT changed with Config, and request tracing with X-Ray.", meta: "9 sections · see everything", href: "/aws/monitoring", available: true },
      { id: "security-services", icon: "🔰", name: "Security Services", desc: "KMS envelope encryption drawn key by key, Secrets Manager rotation, ACM certificates, WAF + Shield blocking attacks at the edge, GuardDuty, Inspector, Security Hub, Macie.", meta: "9 sections · defense in depth", href: "/aws/security-services", available: true },
    ],
  },
  {
    title: "Modern Applications",
    emoji: "⚡",
    items: [
      { id: "serverless", icon: "λ", name: "Serverless — Lambda & Beyond", desc: "Functions, triggers, layers, versions and aliases — the full Lambda lifecycle drawn. API Gateway in front, Step Functions for workflows, EventBridge and DynamoDB Streams.", meta: "10 sections · no servers ⭐", href: "/aws/serverless", available: true },
      { id: "containers", icon: "📦", name: "Containers on AWS", desc: "Docker recap (images, containers, volumes, networks) then the AWS container map: ECR stores images, ECS or EKS orchestrates, EC2 or Fargate runs — decided with a flowchart.", meta: "9 sections · ECS vs EKS", href: "/aws/containers", available: true },
      { id: "devops", icon: "🔁", name: "DevOps — CI/CD & IaC", desc: "Commit → Build → Deploy → Pipeline drawn end to end with CodePipeline, deployment strategies (rolling, blue/green, canary), then Infrastructure as Code: CloudFormation, CDK, Terraform.", meta: "9 sections · automate it all", href: "/aws/devops", available: true },
      { id: "messaging", icon: "📨", name: "Messaging — SQS, SNS & Events", desc: "Why queues decouple services (drawn), Standard vs FIFO, SNS fan-out to thousands, SQS+SNS patterns, EventBridge rules routing events, and Amazon MQ for legacy brokers.", meta: "9 sections · decouple", href: "/aws/messaging", available: true },
    ],
  },
  {
    title: "Data & Machine Learning",
    emoji: "🧠",
    items: [
      { id: "analytics", icon: "🔬", name: "Data Engineering & Analytics", desc: "The modern data pipeline drawn: Kinesis streams in, Glue catalogs & transforms, S3 data lake, Athena queries with SQL, Redshift warehouses, EMR for big data, Lake Formation governs.", meta: "9 sections · the data pipeline", href: "/aws/analytics", available: true },
      { id: "machine-learning", icon: "🤖", name: "Machine Learning Services", desc: "SageMaker's build → train → deploy loop, Bedrock for GenAI, and the ready-made AI services mapped to human senses: Rekognition (eyes), Polly (voice), Transcribe (ears), Comprehend, Textract, Lex.", meta: "8 sections · AI as a service", href: "/aws/machine-learning", available: true },
    ],
  },
  {
    title: "Enterprise & Cost",
    emoji: "🏢",
    items: [
      { id: "migration", icon: "🚚", name: "Migration Services", desc: "The 7 Rs of migration strategy, DMS replicating live databases, DataSync & Transfer Family moving files, MGN lift-and-shift, Snow devices when the network is too slow — all drawn.", meta: "8 sections · move to cloud", href: "/aws/migration", available: true },
      { id: "cost-optimization", icon: "💰", name: "Cost Optimization", desc: "Cost Explorer, Budgets with alerts, then the big three savings levers drawn on one chart: Reserved Instances, Savings Plans and Spot (90% off!), plus Trusted Advisor checks.", meta: "8 sections · stop the bleed ⭐", href: "/aws/cost-optimization", available: true },
      { id: "ha-dr", icon: "🛟", name: "High Availability & DR", desc: "Multi-AZ vs Multi-Region drawn, RTO & RPO on a timeline you'll never forget, and the 4 DR patterns from backup-restore to multi-site active/active with their costs.", meta: "8 sections · survive anything", href: "/aws/ha-dr", available: true },
      { id: "advanced-networking", icon: "🛰️", name: "Advanced Networking", desc: "Transit Gateway as the cloud router (vs peering mesh hell), Direct Connect, Global Accelerator vs CloudFront, PrivateLink and VPC endpoints — private paths to everything.", meta: "8 sections · hybrid scale", href: "/aws/advanced-networking", available: true },
    ],
  },
  {
    title: "Architect Level",
    emoji: "🏗️",
    items: [
      { id: "architecture", icon: "📐", name: "Architecture & Well-Architected", desc: "The 6 design principles, then the Well-Architected Framework's 6 pillars one by one — and a reference 3-tier architecture assembled piece by piece from everything you learned.", meta: "9 sections · capstone ⭐", href: "/aws/architecture", available: true },
      { id: "certifications", icon: "🎓", name: "Certifications Learning Path", desc: "Cloud Practitioner → Associate (SAA, DVA, SOA) → Professional → Specialty: which to take, in what order, what each covers, and how this course maps to each exam.", meta: "7 sections · your roadmap", href: "/aws/certifications", available: true },
    ],
  },
];

export default function AwsPage() {
  const total = GROUPS.reduce((n, g) => n + g.items.length, 0);
  return (
    <main className="hero-gradient grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-sky-400">
            🏠 Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-300">AWS</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(251,146,60,0.5)]"
          >
            ☁️
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">AWS</span> — the complete cloud course
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              From &quot;what is the cloud?&quot; to architecting multi-region systems: every core
              service drawn box by box — VPCs, EC2, S3, Lambda, IAM policies, load balancers and
              DR patterns — {total} topics that build on each other, ending at certification prep.
            </motion.p>
          </div>
        </div>

        {/* The journey strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass mb-12 flex flex-wrap items-center justify-center gap-2 rounded-2xl p-4 text-[11px] font-semibold text-slate-300"
        >
          {["☁️ Cloud basics", "🔐 Account + IAM", "🧱 Core services", "🕸️ VPC networking", "⚡ Serverless + DevOps", "🏗️ Architect", "🎓 Certified"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-orange-400">→</span>}
              </span>
            )
          )}
        </motion.div>

        {/* Grouped category cards */}
        {GROUPS.map((group, g) => (
          <section key={group.title} className="mb-12">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + g * 0.06 }}
              className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400"
            >
              <span className="text-base">{group.emoji}</span>
              {group.title}
              <span className="ml-2 h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
              <span className="text-[10px] font-semibold normal-case tracking-normal text-slate-600">
                {group.items.length} topics
              </span>
            </motion.h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((cat, i) => {
                const card = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + g * 0.06 + i * 0.04 }}
                    whileHover={cat.available ? { y: -5, scale: 1.02 } : undefined}
                    className={`glass relative flex h-full flex-col rounded-2xl p-5 transition-shadow ${
                      cat.available
                        ? "cursor-pointer border-orange-700/50 hover:shadow-[0_0_50px_-15px_rgba(251,146,60,0.6)]"
                        : "opacity-50"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/80 text-xl">
                        {cat.icon}
                      </span>
                      {cat.available ? (
                        <span className="rounded-full border border-emerald-700/50 bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          ● Live
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          🔒 Soon
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">{cat.name}</h3>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400">
                      {cat.desc}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                      <span className="text-[11px] text-slate-500">{cat.meta}</span>
                      {cat.available && (
                        <span className="text-sm font-bold text-orange-400">Open →</span>
                      )}
                    </div>
                  </motion.div>
                );
                return cat.available ? (
                  <Link key={cat.id} href={cat.href} className="h-full">
                    {card}
                  </Link>
                ) : (
                  <div key={cat.id} className="h-full">
                    {card}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
