import { formatPrice } from "./constants";
import type { BrandProfile, BusinessType, PostContent, Template, TemplateVariant } from "./types";
import { BUSINESS_TYPES } from "./constants";

/**
 * Deterministic template system.
 * Layout is owned 100 percent by these engines. AI only writes text.
 * Placeholders: title, subject, location, price, date, meta1, meta2,
 * services, additionalText, image, logo, business name.
 */

export type RenderCtx = {
  content: PostContent;
  brand: BrandProfile;
  businessName: string;
  businessType: BusinessType;
  variant: TemplateVariant;
};

const px = (n: number) => `${n}cqw`;

const font = (brand: BrandProfile) =>
  `"${brand.fontFamily}", "Sora", ui-sans-serif, system-ui, sans-serif`;

const accentColor = (ctx: RenderCtx) =>
  ctx.variant.accent === "secondary" ? ctx.brand.secondary : ctx.brand.primary;

function Img({
  src,
  style,
}: {
  src: string | null;
  style?: React.CSSProperties;
}) {
  if (!src)
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(140deg, #e9e4f7, #d6cbf3)",
          ...style,
        }}
      />
    );
  return (
    <img
      src={src}
      alt=""
      crossOrigin="anonymous"
      style={{ position: "absolute", inset: 0, height: "100%", width: "100%", objectFit: "cover", ...style }}
    />
  );
}

function Logo({ ctx, dark = false }: { ctx: RenderCtx; dark?: boolean }) {
  const { brand, businessName } = ctx;
  if (brand.logoDataUrl) {
    return (
      <img
        src={brand.logoDataUrl}
        alt=""
        crossOrigin="anonymous"
        style={{ height: px(7), width: "auto", objectFit: "contain" }}
      />
    );
  }
  const initials = (businessName || "R")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        height: px(7),
        width: px(7),
        borderRadius: px(2.2),
        display: "grid",
        placeItems: "center",
        fontSize: px(2.9),
        fontWeight: 800,
        color: dark ? brand.primary : "#fff",
        background: dark
          ? "rgba(255,255,255,0.94)"
          : `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`,
      }}
    >
      {initials}
    </div>
  );
}

/** Business type decides which secondary values appear on the design. */
export function metaItems(content: PostContent, type: BusinessType): string[] {
  const out: string[] = [];
  const push = (v: string, suffix = "") => {
    if (v && v.trim()) out.push(v.trim() + suffix);
  };
  if (type === "travel_agency") {
    push(content.location);
    push(content.meta1);
    push(content.date);
  } else if (type === "real_estate") {
    push(content.meta1);
    push(content.meta2);
    push(content.date);
  } else if (type === "car_dealership") {
    push(content.meta1);
    push(content.meta2);
    push(content.date);
  } else if (type === "restaurant") {
    push(content.location);
    push(content.date);
  } else {
    push(content.meta1);
    push(content.date);
  }
  return out;
}

function Chips({ items, tone }: { items: string[]; tone: "light" | "dark" }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: px(1.3) }}>
      {items.slice(0, 6).map((s) => (
        <span
          key={s}
          style={{
            fontSize: px(2.4),
            fontWeight: 600,
            padding: `${px(0.9)} ${px(2.2)}`,
            borderRadius: px(10),
            color: tone === "light" ? "#fff" : "#221a33",
            background: tone === "light" ? "rgba(255,255,255,0.18)" : "rgba(24,12,45,0.06)",
            border: `1px solid ${tone === "light" ? "rgba(255,255,255,0.34)" : "rgba(24,12,45,0.08)"}`,
            backdropFilter: "blur(6px)",
          }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function PriceBadge({ ctx, tone }: { ctx: RenderCtx; tone: "light" | "dark" }) {
  const price = formatPrice(ctx.content.price, ctx.brand.currency);
  if (!price) return null;
  const square = ctx.variant.badge === "square";
  return (
    <span
      style={{
        display: "inline-block",
        alignSelf: "flex-start",
        padding: `${px(1.6)} ${px(3.4)}`,
        borderRadius: square ? px(1.6) : px(10),
        fontWeight: 800,
        fontSize: px(4.2),
        letterSpacing: "-0.01em",
        color: tone === "light" ? accentColor(ctx) : "#fff",
        background:
          tone === "light"
            ? "#fff"
            : `linear-gradient(135deg, ${ctx.brand.primary}, ${ctx.brand.secondary})`,
      }}
    >
      {price}
    </span>
  );
}

function Kicker({ ctx, color }: { ctx: RenderCtx; color: string }) {
  const value = ctx.content.subject.trim() || ctx.businessName;
  if (!value) return null;
  return (
    <span
      style={{
        fontSize: px(2.7),
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color,
      }}
    >
      {value}
    </span>
  );
}

function Title({ ctx, size, color }: { ctx: RenderCtx; size: number; color: string }) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: px(size),
        lineHeight: 1.03,
        fontWeight: 800,
        letterSpacing: "-0.03em",
        color,
      }}
    >
      {ctx.content.title || "Your headline here"}
    </h2>
  );
}

function BizRow({ ctx, tone }: { ctx: RenderCtx; tone: "light" | "dark" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: px(2.2) }}>
      <Logo ctx={ctx} dark={tone === "dark"} />
      <span
        style={{
          fontSize: px(2.9),
          fontWeight: 700,
          color: tone === "light" ? "#fff" : "#1a1225",
        }}
      >
        {ctx.businessName}
      </span>
    </div>
  );
}

type Engine = { id: string; label: string; render: (ctx: RenderCtx) => React.ReactNode };

const base = (brand: BrandProfile): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  fontFamily: font(brand),
  overflow: "hidden",
});

const engines: Engine[] = [
  {
    id: "aurora",
    label: "Aurora",
    render: (ctx) => {
      const { content, brand, variant } = ctx;
      const align = variant.align === "center" ? "center" : "flex-start";
      return (
        <div style={{ ...base(brand), color: "#fff" }}>
          <Img src={content.imageDataUrl} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to top, ${brand.primary}f2 4%, ${brand.primary}55 40%, transparent 68%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: px(6),
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: align,
              textAlign: variant.align,
            }}
          >
            <div style={{ display: "flex", width: "100%", alignItems: "center", gap: px(2.2) }}>
              <BizRow ctx={ctx} tone="light" />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: px(2.2),
                alignItems: align,
                width: "100%",
              }}
            >
              <Kicker ctx={ctx} color="rgba(255,255,255,0.92)" />
              <Title ctx={ctx} size={9.4} color="#fff" />
              {content.additionalText ? (
                <p style={{ margin: 0, fontSize: px(2.9), opacity: 0.9, lineHeight: 1.35 }}>
                  {content.additionalText}
                </p>
              ) : null}
              <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="light" />
              <PriceBadge ctx={ctx} tone="light" />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "editorial",
    label: "Editorial",
    render: (ctx) => {
      const { content, brand, variant } = ctx;
      return (
        <div style={{ ...base(brand), background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", flex: "0 0 58%" }}>
            <Img src={content.imageDataUrl} />
          </div>
          <div
            style={{
              flex: 1,
              padding: px(6),
              display: "flex",
              flexDirection: "column",
              gap: px(2),
              color: "#1a1225",
              textAlign: variant.align,
              alignItems: variant.align === "center" ? "center" : "flex-start",
            }}
          >
            <Kicker ctx={ctx} color={accentColor(ctx)} />
            <Title ctx={ctx} size={7.4} color="#1a1225" />
            {content.additionalText ? (
              <p style={{ margin: 0, fontSize: px(2.8), lineHeight: 1.4, opacity: 0.62 }}>
                {content.additionalText}
              </p>
            ) : null}
            <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="dark" />
            <div style={{ marginTop: "auto", display: "flex", width: "100%", alignItems: "center", gap: px(2.2) }}>
              <BizRow ctx={ctx} tone="dark" />
              <span style={{ marginLeft: "auto" }}>
                <PriceBadge ctx={ctx} tone="dark" />
              </span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "glass",
    label: "Glass",
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: brand.primary }}>
          <Img src={content.imageDataUrl} style={{ filter: "blur(3px) saturate(115%)", transform: "scale(1.1)" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(160deg, ${brand.primary}88, ${brand.secondary}99)`,
            }}
          />
          <div style={{ position: "absolute", inset: 0, padding: px(6), display: "flex", flexDirection: "column", gap: px(3.6) }}>
            <BizRow ctx={ctx} tone="light" />
            <div style={{ position: "relative", flex: 1, borderRadius: px(5), overflow: "hidden", boxShadow: "0 30px 60px -30px rgba(0,0,0,.5)" }}>
              <Img src={content.imageDataUrl} />
            </div>
            <div
              style={{
                borderRadius: px(5),
                padding: px(4.4),
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.6)",
                backdropFilter: "blur(20px)",
                display: "flex",
                flexDirection: "column",
                gap: px(1.7),
                color: "#181026",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: px(2) }}>
                <Kicker ctx={ctx} color={accentColor(ctx)} />
                <span style={{ marginLeft: "auto" }}>
                  <PriceBadge ctx={ctx} tone="dark" />
                </span>
              </div>
              <Title ctx={ctx} size={6.2} color="#181026" />
              {content.additionalText ? (
                <p style={{ margin: 0, fontSize: px(2.6), lineHeight: 1.4, opacity: 0.62 }}>
                  {content.additionalText}
                </p>
              ) : null}
              <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="dark" />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "split",
    label: "Split",
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), display: "flex" }}>
          <div
            style={{
              flex: "0 0 46%",
              padding: px(5),
              display: "flex",
              flexDirection: "column",
              gap: px(2),
              color: "#fff",
              background: `linear-gradient(170deg, ${brand.primary}, ${brand.secondary})`,
            }}
          >
            <BizRow ctx={ctx} tone="light" />
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: px(2) }}>
              <Kicker ctx={ctx} color="rgba(255,255,255,0.85)" />
              <Title ctx={ctx} size={6.6} color="#fff" />
              {content.additionalText ? (
                <p style={{ margin: 0, fontSize: px(2.5), opacity: 0.85, lineHeight: 1.4 }}>
                  {content.additionalText}
                </p>
              ) : null}
              <PriceBadge ctx={ctx} tone="light" />
            </div>
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <Img src={content.imageDataUrl} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,4,24,.55), transparent 55%)" }} />
            <div style={{ position: "absolute", inset: 0, padding: px(4), display: "flex", alignItems: "flex-end" }}>
              <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="light" />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "frame",
    label: "Frame",
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: "#faf8ff", padding: px(4.5), display: "flex", flexDirection: "column", gap: px(3) }}>
          <div
            style={{
              position: "relative",
              flex: 1,
              borderRadius: px(4),
              overflow: "hidden",
              border: `${px(0.9)} solid ${brand.primary}`,
            }}
          >
            <Img src={content.imageDataUrl} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${brand.primary}aa, transparent 60%)` }} />
            <div style={{ position: "absolute", left: px(4), right: px(4), bottom: px(4), display: "flex", flexDirection: "column", gap: px(1.6) }}>
              <Kicker ctx={ctx} color="rgba(255,255,255,0.9)" />
              <Title ctx={ctx} size={7} color="#fff" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: px(2.4), color: "#1a1225" }}>
            <BizRow ctx={ctx} tone="dark" />
            <span style={{ marginLeft: "auto" }}>
              <PriceBadge ctx={ctx} tone="dark" />
            </span>
          </div>
          <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="dark" />
        </div>
      );
    },
  },
  {
    id: "duotone",
    label: "Duotone",
    render: (ctx) => {
      const { content, brand, variant } = ctx;
      return (
        <div style={{ ...base(brand), background: brand.primary, color: "#fff" }}>
          <Img src={content.imageDataUrl} style={{ mixBlendMode: "luminosity", opacity: 0.9 }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(210deg, ${brand.secondary}66, ${brand.primary}dd)` }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: px(6),
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: px(2.4),
              textAlign: variant.align,
              alignItems: variant.align === "center" ? "center" : "flex-start",
            }}
          >
            <Kicker ctx={ctx} color="rgba(255,255,255,0.8)" />
            <Title ctx={ctx} size={10.5} color="#fff" />
            {content.additionalText ? (
              <p style={{ margin: 0, fontSize: px(2.9), opacity: 0.86, lineHeight: 1.35 }}>{content.additionalText}</p>
            ) : null}
            <Chips items={metaItems(content, ctx.businessType)} tone="light" />
            <PriceBadge ctx={ctx} tone="light" />
          </div>
          <div style={{ position: "absolute", left: px(6), bottom: px(6) }}>
            <BizRow ctx={ctx} tone="light" />
          </div>
        </div>
      );
    },
  },
  {
    id: "ticket",
    label: "Ticket",
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: "#fff", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", flex: "0 0 52%" }}>
            <Img src={content.imageDataUrl} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${brand.primary}55, transparent 55%)` }} />
            <div style={{ position: "absolute", left: px(4.5), top: px(4.5) }}>
              <BizRow ctx={ctx} tone="light" />
            </div>
          </div>
          <div style={{ height: 0, borderTop: `${px(0.5)} dashed ${brand.primary}55` }} />
          <div style={{ flex: 1, padding: px(5.5), display: "flex", flexDirection: "column", gap: px(1.8), color: "#181026" }}>
            <Kicker ctx={ctx} color={accentColor(ctx)} />
            <Title ctx={ctx} size={6.8} color="#181026" />
            <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="dark" />
            <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end" }}>
              {content.additionalText ? (
                <p style={{ margin: 0, maxWidth: "62%", fontSize: px(2.5), lineHeight: 1.4, opacity: 0.6 }}>
                  {content.additionalText}
                </p>
              ) : null}
              <span style={{ marginLeft: "auto" }}>
                <PriceBadge ctx={ctx} tone="dark" />
              </span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "minimal",
    label: "Minimal",
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: "#fff", padding: px(7), display: "flex", flexDirection: "column", gap: px(3.4) }}>
          <BizRow ctx={ctx} tone="dark" />
          <div style={{ position: "relative", flex: "0 0 44%", borderRadius: px(3), overflow: "hidden" }}>
            <Img src={content.imageDataUrl} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: px(1.8), color: "#131020" }}>
            <Kicker ctx={ctx} color={accentColor(ctx)} />
            <Title ctx={ctx} size={7.2} color="#131020" />
            {content.additionalText ? (
              <p style={{ margin: 0, fontSize: px(2.7), lineHeight: 1.45, opacity: 0.55 }}>{content.additionalText}</p>
            ) : null}
          </div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: px(2) }}>
            <Chips items={metaItems(content, ctx.businessType)} tone="dark" />
            <span style={{ marginLeft: "auto" }}>
              <PriceBadge ctx={ctx} tone="dark" />
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "poster",
    label: "Poster",
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), color: "#fff" }}>
          <Img src={content.imageDataUrl} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${brand.primary}e6 0%, ${brand.primary}33 45%, rgba(8,4,20,.6) 100%)` }} />
          <div style={{ position: "absolute", inset: 0, padding: px(6), display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: px(2) }}>
              <Kicker ctx={ctx} color="rgba(255,255,255,0.88)" />
              <Title ctx={ctx} size={10} color="#fff" />
              {content.additionalText ? (
                <p style={{ margin: 0, fontSize: px(2.9), opacity: 0.9, lineHeight: 1.35 }}>{content.additionalText}</p>
              ) : null}
            </div>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: px(2.4) }}>
              <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="light" />
              <div style={{ display: "flex", alignItems: "center", gap: px(2.2) }}>
                <BizRow ctx={ctx} tone="light" />
                <span style={{ marginLeft: "auto" }}>
                  <PriceBadge ctx={ctx} tone="light" />
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "banner",
    label: "Banner",
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), display: "flex", flexDirection: "column", background: "#0e0820" }}>
          <div
            style={{
              flex: "0 0 42%",
              padding: px(5.5),
              display: "flex",
              flexDirection: "column",
              gap: px(1.8),
              color: "#fff",
              background: `linear-gradient(120deg, ${brand.primary}, ${brand.secondary})`,
            }}
          >
            <BizRow ctx={ctx} tone="light" />
            <Title ctx={ctx} size={7.4} color="#fff" />
            <Kicker ctx={ctx} color="rgba(255,255,255,0.82)" />
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <Img src={content.imageDataUrl} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,4,20,.7), transparent 60%)" }} />
            <div style={{ position: "absolute", inset: 0, padding: px(5), display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: px(2) }}>
              <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="light" />
              <div style={{ display: "flex", alignItems: "center" }}>
                {content.additionalText ? (
                  <p style={{ margin: 0, maxWidth: "60%", color: "#fff", fontSize: px(2.5), opacity: 0.85, lineHeight: 1.35 }}>
                    {content.additionalText}
                  </p>
                ) : null}
                <span style={{ marginLeft: "auto" }}>
                  <PriceBadge ctx={ctx} tone="light" />
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "spotlight",
    label: "Spotlight",
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: `radial-gradient(120% 80% at 50% 0%, ${brand.secondary}33, #ffffff 62%)` }}>
          <div style={{ position: "absolute", inset: 0, padding: px(6), display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: px(2.6) }}>
            <BizRow ctx={ctx} tone="dark" />
            <div
              style={{
                position: "relative",
                width: "78%",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                overflow: "hidden",
                boxShadow: `0 ${px(4)} ${px(12)} -${px(4)} ${brand.primary}66`,
                border: `${px(0.8)} solid #fff`,
              }}
            >
              <Img src={content.imageDataUrl} />
            </div>
            <Kicker ctx={ctx} color={accentColor(ctx)} />
            <Title ctx={ctx} size={7} color="#141024" />
            <Chips items={metaItems(content, ctx.businessType)} tone="dark" />
            <div style={{ marginTop: "auto" }}>
              <PriceBadge ctx={ctx} tone="dark" />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "stack",
    label: "Stack",
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), display: "flex", flexDirection: "column", background: "#fff" }}>
          <div style={{ padding: px(5.5), display: "flex", flexDirection: "column", gap: px(1.6), color: "#141024" }}>
            <Kicker ctx={ctx} color={accentColor(ctx)} />
            <Title ctx={ctx} size={6.6} color="#141024" />
          </div>
          <div style={{ position: "relative", flex: 1, margin: `0 ${px(5.5)}`, borderRadius: px(3.6), overflow: "hidden" }}>
            <Img src={content.imageDataUrl} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${brand.primary}66, transparent 55%)` }} />
            <div style={{ position: "absolute", right: px(3.4), top: px(3.4) }}>
              <PriceBadge ctx={ctx} tone="light" />
            </div>
          </div>
          <div style={{ padding: px(5.5), display: "flex", flexDirection: "column", gap: px(2) }}>
            <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="dark" />
            <div style={{ display: "flex", alignItems: "center", gap: px(2.2) }}>
              <BizRow ctx={ctx} tone="dark" />
              {content.additionalText ? (
                <p style={{ margin: 0, marginLeft: "auto", maxWidth: "55%", textAlign: "right", fontSize: px(2.4), opacity: 0.55, lineHeight: 1.35 }}>
                  {content.additionalText}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      );
    },
  },
];

export const engineIds = engines.map((e) => e.id);

const engineMap = new Map(engines.map((e) => [e.id, e]));

const variants: TemplateVariant[] = [
  { align: "left", tone: "light", badge: "pill", accent: "primary" },
  { align: "center", tone: "light", badge: "square", accent: "secondary" },
  { align: "left", tone: "dark", badge: "square", accent: "primary" },
  { align: "center", tone: "dark", badge: "pill", accent: "secondary" },
];

const NAME_PREFIX: Record<BusinessType, string[]> = {
  other: [
    "Signal",
    "Studio",
    "Format",
    "Motion",
    "Layer",
    "Frame",
    "Accent",
    "Prism",
    "Vertex",
    "Onyx",
  ],
  travel_agency: [
    "Escape",
    "Horizon",
    "Lagoon",
    "Voyage",
    "Sunset",
    "Compass",
    "Island",
    "Getaway",
    "Atlas",
    "Skyline",
  ],
  real_estate: [
    "Estate",
    "Residence",
    "Skyline",
    "Terrace",
    "Keystone",
    "Atrium",
    "Loft",
    "Harbor",
    "Manor",
    "Cornerstone",
  ],
  car_dealership: [
    "Drive",
    "Torque",
    "Chrome",
    "Velocity",
    "Garage",
    "Autobahn",
    "Apex",
    "Motorline",
    "Gearbox",
    "Roadster",
  ],
  restaurant: [
    "Table",
    "Kitchen",
    "Ember",
    "Harvest",
    "Bistro",
    "Plate",
    "Cellar",
    "Market",
    "Supper",
    "Pantry",
  ],
  retail: [
    "Shelf",
    "Drop",
    "Boutique",
    "Aisle",
    "Studio",
    "Counter",
    "Bundle",
    "Window",
    "Label",
    "Stockroom",
  ],
};

/** Exactly 10 templates per quick start business type, 50 total. */
const QUICK_START_TYPES = BUSINESS_TYPES.filter((t) => t !== "other");

function buildGlobalTemplates(): Template[] {
  const out: Template[] = [];
  QUICK_START_TYPES.forEach((type, typeIndex) => {
    for (let i = 0; i < 10; i++) {
      const engine = engines[(i + typeIndex * 3) % engines.length]!;
      const variant = variants[(i + typeIndex) % variants.length]!;
      out.push({
        id: `${type}_${i + 1}`,
        name: `${NAME_PREFIX[type]![i]} ${engine.label}`,
        businessType: type,
        engine: engine.id,
        variant,
        scope: "global",
        businessId: null,
        archived: false,
      });
    }
  });
  return out;
}

export const globalTemplates: Template[] = buildGlobalTemplates();

export function renderTemplate(
  template: Template,
  args: Omit<RenderCtx, "variant">,
): React.ReactNode {
  const engine = engineMap.get(template.engine) ?? engines[0]!;
  return engine.render({ ...args, variant: template.variant });
}
