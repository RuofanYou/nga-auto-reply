export type AppEnv = Env & {
  ADMIN_TOKEN: string;
  ADMUSE_COOKIE?: string;
};

export type SourceKind = "browser" | "json-feed" | "manual";
export type DigestPeriod = "daily" | "weekly" | "monthly";

export interface SourceRow {
  id: string;
  name: string;
  kind: SourceKind;
  url: string | null;
  enabled: number;
  config_json: string;
  last_collected_at: string | null;
  last_status: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrowserSelectors {
  card: string;
  title?: string;
  advertiser?: string;
  link?: string;
  image?: string;
  video?: string;
  rank?: string;
}

export interface BrowserSourceConfig {
  maxCards?: number;
  waitMs?: number;
  selectors?: BrowserSelectors;
}

export interface RawCreativeInput {
  externalId?: string;
  title: string;
  advertiser?: string;
  platform?: string;
  industry?: string;
  mediaType?: string;
  mediaUrl?: string;
  canonicalUrl?: string;
  rank?: number;
  rawText?: string;
  observedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CreativeRow {
  id: string;
  source_id: string;
  external_id: string | null;
  canonical_url: string | null;
  title: string;
  advertiser: string | null;
  platform: string | null;
  industry: string | null;
  media_type: string;
  media_url: string | null;
  first_seen_at: string;
  last_seen_at: string;
  active_days: number;
  rank_current: number | null;
  rank_previous: number | null;
  rank_delta: number;
  content_hash: string;
  raw_text: string;
  status: "new" | "queued" | "analyzed" | "failed" | "ignored";
  created_at: string;
  updated_at: string;
}

export interface CreativeAnalysis {
  summary: string;
  hookType: string;
  hookText: string;
  audiencePrimary: string;
  emotionalLevers: string[];
  gameMechanics: string[];
  gameplayPrimary: string;
  educationConstructs: string[];
  educationPrimary: string;
  cta: string;
  riskFlags: string[];
  riskScore: number;
  confidence: number;
}

export type PipelineMessage =
  | {
      type: "collect_source";
      sourceId: string;
      runId: string;
    }
  | {
      type: "analyze_creative";
      creativeId: string;
      force?: boolean;
    }
  | {
      type: "extract_snapshot";
      snapshotId: string;
    }
  | {
      type: "build_digest";
      period: DigestPeriod;
    }
  | {
      type: "generate_opportunities";
    };

export interface BrowserCard {
  externalId?: string;
  title: string;
  advertiser?: string;
  canonicalUrl?: string;
  mediaUrl?: string;
  mediaType?: string;
  rank?: number;
  rawText?: string;
}

export interface SearchResultRow {
  kind: "creative" | "opportunity" | "digest";
  id: string;
  title: string;
  snippet: string;
  updated_at: string;
}

export interface PublicSummary {
  totalCreatives: number;
  analyzedCreatives: number;
  newLast24h: number;
  opportunityCount: number;
  approvedCount: number;
  enabledSources: number;
  latestRun: {
    id: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    triggerType: string;
  } | null;
  latestDigest: {
    id: string;
    period: DigestPeriod;
    title: string;
    summary: string;
    createdAt: string;
  } | null;
}
