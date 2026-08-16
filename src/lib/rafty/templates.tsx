import { formatPrice, FORMAT_SPECS } from "./constants";
import { FitText } from "@/components/rafty/FitText";
import type {
  BrandProfile,
  BusinessType,
  ContentFormat,
  PostAdjustments,
  PostContent,
  Template,
  TemplateTag,
  TemplateVariant,
  TemplateZone,
  ZoneKey,
} from "./types";

/**
 * Deterministic template system.
 * Layout is owned 100 percent by these engines. AI only writes text.
 * Placeholders: title, subject, location, price, date, meta1, meta2,
 * services, additionalText, cta, image, logo, business name.
 */

export type RenderCtx = {
  content: PostContent;
  brand: BrandProfile;
  businessName: string;
  businessType: BusinessType;
  variant: TemplateVariant;
  showBrandName?: boolean;
  adjustments?: PostAdjustments;
  /** Renders the brand contact zone when a template opts in. */
  showContact?: boolean;
};

const px = (n: number) => `${n}cqw`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const font = (brand: BrandProfile) =>
  `"${brand.fontFamily}", "Sora", ui-sans-serif, system-ui, sans-serif`;

const fontSecondary = (brand: BrandProfile) =>
  `"${brand.fontSecondary || brand.fontFamily}", "Sora", ui-sans-serif, system-ui, sans-serif`;

const accentColor = (ctx: RenderCtx) =>
  ctx.variant.accent === "secondary"
    ? ctx.brand.secondary
    : ctx.variant.accent === "accent"
      ? ctx.brand.accent
      : ctx.brand.primary;

/** Clamped translate/scale/align applied only to the dynamic content block. */
function AdjustBox({ ctx, children, style }: { ctx: RenderCtx; children: React.ReactNode; style?: React.CSSProperties }) {
  const adjust = ctx.adjustments?.text;
  const x = clamp(adjust?.x ?? 0, -12, 12);
  const y = clamp(adjust?.y ?? 0, -12, 12);
  const scale = clamp(adjust?.scale ?? 1, 0.8, 1.25);
  const align = adjust?.align;
  return (
    <div
      style={{
        transform: `translate(${x}cqw, ${y}cqw) scale(${scale})`,
        transformOrigin: align === "right" ? "right center" : align === "center" ? "center" : "left center",
        textAlign: align,
        alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

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

/** Logo only renders when a real logo file exists. Never fabricated marks. */
function Logo({ ctx }: { ctx: RenderCtx }) {
  const { brand } = ctx;
  if (!brand.logoDataUrl) return null;
  return (
    <img
      src={brand.logoDataUrl}
      alt=""
      crossOrigin="anonymous"
      style={{ height: px(7), width: "auto", objectFit: "contain" }}
    />
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
        fontFamily: font(ctx.brand),
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

function CtaTag({ ctx, tone }: { ctx: RenderCtx; tone: "light" | "dark" }) {
  const cta = ctx.content.cta.trim();
  if (!cta) return null;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: px(2.6),
        fontWeight: 700,
        letterSpacing: "0.02em",
        padding: `${px(1.1)} ${px(2.6)}`,
        borderRadius: px(9),
        fontFamily: fontSecondary(ctx.brand),
        color: tone === "light" ? "#0f0a1a" : "#fff",
        background: tone === "light" ? "#fff" : accentColor(ctx),
      }}
    >
      {cta}
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
        fontFamily: fontSecondary(ctx.brand),
        color,
      }}
    >
      {value}
    </span>
  );
}

function Title({ ctx, size, color }: { ctx: RenderCtx; size: number; color: string }) {
  return (
    <FitText
      as="h2"
      text={ctx.content.title || "Your headline here"}
      maxSize={size}
      minSize={Math.max(3.2, size * 0.45)}
      maxLines={3}
      lineHeight={1.03}
      tightLineHeight={0.98}
      style={{
        fontWeight: 800,
        letterSpacing: "-0.03em",
        fontFamily: font(ctx.brand),
        color,
      }}
    />
  );
}

/** Shrinks to fit rather than clipping or overflowing its zone. */
function AdditionalText({
  ctx,
  size,
  opacity = 1,
  style,
}: {
  ctx: RenderCtx;
  size: number;
  opacity?: number;
  style?: React.CSSProperties;
}) {
  const text = ctx.content.additionalText;
  if (!text) return null;
  return (
    <FitText
      as="p"
      text={text}
      maxSize={size}
      minSize={Math.max(1.8, size * 0.65)}
      maxLines={3}
      lineHeight={1.4}
      tightLineHeight={1.25}
      style={{ opacity, fontFamily: fontSecondary(ctx.brand), ...style }}
    />
  );
}

/** Compact contact line, only rendered when the post opts in. Tasteful and
 * small: never more than a single wrapped line of the brand's essentials. */
function ContactLine({ ctx, tone }: { ctx: RenderCtx; tone: "light" | "dark" }) {
  if (!ctx.showContact) return null;
  const { contact } = ctx.brand;
  if (!contact) return null;
  const parts = [
    contact.phones.filter(Boolean)[0],
    contact.email,
    contact.website,
    contact.address,
    contact.social,
  ].filter((v): v is string => !!v && v.trim().length > 0);
  if (!parts.length) return null;
  return (
    <div
      style={{
        fontSize: px(2.1),
        fontWeight: 500,
        lineHeight: 1.4,
        fontFamily: fontSecondary(ctx.brand),
        color: tone === "light" ? "rgba(255,255,255,0.85)" : "rgba(20,16,32,0.62)",
      }}
    >
      {parts.join("  ·  ")}
    </div>
  );
}

function BizRow({ ctx, tone }: { ctx: RenderCtx; tone: "light" | "dark" }) {
  const showName = !!ctx.showBrandName && !!ctx.businessName;
  const hasLogo = !!ctx.brand.logoDataUrl;
  if (!showName && !hasLogo) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: px(2.2) }}>
      <Logo ctx={ctx} />
      {showName ? (
        <span
          style={{
            fontSize: px(2.9),
            fontWeight: 700,
            fontFamily: fontSecondary(ctx.brand),
            color: tone === "light" ? "#fff" : "#1a1225",
          }}
        >
          {ctx.businessName}
        </span>
      ) : null}
    </div>
  );
}

type Engine = { id: string; label: string; tags: TemplateTag[]; render: (ctx: RenderCtx) => React.ReactNode };

const base = (brand: BrandProfile): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  fontFamily: font(brand),
  overflow: "hidden",
});

const bgOr = (brand: BrandProfile, fallback: string) => brand.background || fallback;

const engines: Engine[] = [
  {
    id: "aurora",
    label: "Aurora",
    tags: ["image_first", "gradient", "bold"],
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
            <AdjustBox
              ctx={ctx}
              style={{ display: "flex", flexDirection: "column", gap: px(2.2), alignItems: align, width: "100%" }}
            >
              <Kicker ctx={ctx} color="rgba(255,255,255,0.92)" />
              <Title ctx={ctx} size={9.4} color="#fff" />
              <AdditionalText ctx={ctx} size={2.9} opacity={0.9} />
              <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="light" />
              <div style={{ display: "flex", gap: px(2), alignItems: "center", flexWrap: "wrap" }}>
                <PriceBadge ctx={ctx} tone="light" />
                <CtaTag ctx={ctx} tone="light" />
              </div>
              <ContactLine ctx={ctx} tone="light" />
            </AdjustBox>
          </div>
        </div>
      );
    },
  },
  {
    id: "editorial",
    label: "Editorial",
    tags: ["editorial", "image_first", "light"],
    render: (ctx) => {
      const { content, brand, variant } = ctx;
      return (
        <div style={{ ...base(brand), background: bgOr(brand, "#fff"), display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", flex: "0 0 58%" }}>
            <Img src={content.imageDataUrl} />
          </div>
          <AdjustBox
            ctx={ctx}
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
            <AdditionalText ctx={ctx} size={2.8} opacity={0.62} />
            <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="dark" />
            <div style={{ marginTop: "auto", display: "flex", width: "100%", alignItems: "center", gap: px(2.2) }}>
              <BizRow ctx={ctx} tone="dark" />
              <span style={{ marginLeft: "auto", display: "flex", gap: px(1.6), alignItems: "center" }}>
                <CtaTag ctx={ctx} tone="dark" />
                <PriceBadge ctx={ctx} tone="dark" />
              </span>
            </div>
            <ContactLine ctx={ctx} tone="dark" />
          </AdjustBox>
        </div>
      );
    },
  },
  {
    id: "glass",
    label: "Glass Panel",
    tags: ["glass", "blur", "luxury"],
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
            <AdjustBox
              ctx={ctx}
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
              <AdditionalText ctx={ctx} size={2.6} opacity={0.62} />
              <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="dark" />
            </AdjustBox>
          </div>
        </div>
      );
    },
  },
  {
    id: "split",
    label: "Split",
    tags: ["split", "gradient", "bold"],
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
            <AdjustBox ctx={ctx} style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: px(2) }}>
              <Kicker ctx={ctx} color="rgba(255,255,255,0.85)" />
              <Title ctx={ctx} size={6.6} color="#fff" />
              <AdditionalText ctx={ctx} size={2.5} opacity={0.85} />
              <PriceBadge ctx={ctx} tone="light" />
              <CtaTag ctx={ctx} tone="light" />
            </AdjustBox>
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
    tags: ["editorial", "centered", "light"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: bgOr(brand, "#faf8ff"), padding: px(4.5), display: "flex", flexDirection: "column", gap: px(3) }}>
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
            <AdjustBox ctx={ctx} style={{ position: "absolute", left: px(4), right: px(4), bottom: px(4), display: "flex", flexDirection: "column", gap: px(1.6) }}>
              <Kicker ctx={ctx} color="rgba(255,255,255,0.9)" />
              <Title ctx={ctx} size={7} color="#fff" />
            </AdjustBox>
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
    tags: ["gradient", "bold", "dark"],
    render: (ctx) => {
      const { content, brand, variant } = ctx;
      return (
        <div style={{ ...base(brand), background: brand.primary, color: "#fff" }}>
          <Img src={content.imageDataUrl} style={{ mixBlendMode: "luminosity", opacity: 0.9 }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(210deg, ${brand.secondary}66, ${brand.primary}dd)` }} />
          <AdjustBox
            ctx={ctx}
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
            <AdditionalText ctx={ctx} size={2.9} opacity={0.86} />
            <Chips items={metaItems(content, ctx.businessType)} tone="light" />
            <PriceBadge ctx={ctx} tone="light" />
          </AdjustBox>
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
    tags: ["dense", "offer", "light"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: bgOr(brand, "#fff"), display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", flex: "0 0 52%" }}>
            <Img src={content.imageDataUrl} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${brand.primary}55, transparent 55%)` }} />
            <div style={{ position: "absolute", left: px(4.5), top: px(4.5) }}>
              <BizRow ctx={ctx} tone="light" />
            </div>
          </div>
          <div style={{ height: 0, borderTop: `${px(0.5)} dashed ${brand.primary}55` }} />
          <AdjustBox ctx={ctx} style={{ flex: 1, padding: px(5.5), display: "flex", flexDirection: "column", gap: px(1.8), color: "#181026" }}>
            <Kicker ctx={ctx} color={accentColor(ctx)} />
            <Title ctx={ctx} size={6.8} color="#181026" />
            <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="dark" />
            <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end" }}>
              <AdditionalText ctx={ctx} size={2.5} opacity={0.6} style={{ maxWidth: "62%" }} />
              <span style={{ marginLeft: "auto" }}>
                <PriceBadge ctx={ctx} tone="dark" />
              </span>
            </div>
          </AdjustBox>
        </div>
      );
    },
  },
  {
    id: "minimal",
    label: "Minimal",
    tags: ["minimal", "whitespace", "light"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: bgOr(brand, "#fff"), padding: px(7), display: "flex", flexDirection: "column", gap: px(3.4) }}>
          <BizRow ctx={ctx} tone="dark" />
          <div style={{ position: "relative", flex: "0 0 44%", borderRadius: px(3), overflow: "hidden" }}>
            <Img src={content.imageDataUrl} />
          </div>
          <AdjustBox ctx={ctx} style={{ display: "flex", flexDirection: "column", gap: px(1.8), color: "#131020" }}>
            <Kicker ctx={ctx} color={accentColor(ctx)} />
            <Title ctx={ctx} size={7.2} color="#131020" />
            <AdditionalText ctx={ctx} size={2.7} opacity={0.55} />
          </AdjustBox>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: px(2) }}>
            <Chips items={metaItems(content, ctx.businessType)} tone="dark" />
            <span style={{ marginLeft: "auto" }}>
              <PriceBadge ctx={ctx} tone="dark" />
            </span>
          </div>
          <ContactLine ctx={ctx} tone="dark" />
        </div>
      );
    },
  },
  {
    id: "poster",
    label: "Poster",
    tags: ["bold", "type_first", "dark"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), color: "#fff" }}>
          <Img src={content.imageDataUrl} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${brand.primary}e6 0%, ${brand.primary}33 45%, rgba(8,4,20,.6) 100%)` }} />
          <div style={{ position: "absolute", inset: 0, padding: px(6), display: "flex", flexDirection: "column" }}>
            <AdjustBox ctx={ctx} style={{ display: "flex", flexDirection: "column", gap: px(2) }}>
              <Kicker ctx={ctx} color="rgba(255,255,255,0.88)" />
              <Title ctx={ctx} size={10} color="#fff" />
              <AdditionalText ctx={ctx} size={2.9} opacity={0.9} />
            </AdjustBox>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: px(2.4) }}>
              <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="light" />
              <div style={{ display: "flex", alignItems: "center", gap: px(2.2) }}>
                <BizRow ctx={ctx} tone="light" />
                <span style={{ marginLeft: "auto" }}>
                  <PriceBadge ctx={ctx} tone="light" />
                </span>
              </div>
              <ContactLine ctx={ctx} tone="light" />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "banner",
    label: "Banner",
    tags: ["split", "gradient", "dark"],
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
            <AdjustBox ctx={ctx} style={{ display: "flex", flexDirection: "column", gap: px(1.8) }}>
              <Title ctx={ctx} size={7.4} color="#fff" />
              <Kicker ctx={ctx} color="rgba(255,255,255,0.82)" />
            </AdjustBox>
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <Img src={content.imageDataUrl} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,4,20,.7), transparent 60%)" }} />
            <div style={{ position: "absolute", inset: 0, padding: px(5), display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: px(2) }}>
              <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="light" />
              <div style={{ display: "flex", alignItems: "center" }}>
                <AdditionalText ctx={ctx} size={2.5} opacity={0.85} style={{ maxWidth: "60%", color: "#fff" }} />
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
    tags: ["centered", "whitespace", "light"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: bgOr(brand, `radial-gradient(120% 80% at 50% 0%, ${brand.secondary}33, #ffffff 62%)`) }}>
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
            <AdjustBox ctx={ctx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: px(2.6) }}>
              <Kicker ctx={ctx} color={accentColor(ctx)} />
              <Title ctx={ctx} size={7} color="#141024" />
              <Chips items={metaItems(content, ctx.businessType)} tone="dark" />
            </AdjustBox>
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
    tags: ["dense", "editorial", "light"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), display: "flex", flexDirection: "column", background: bgOr(brand, "#fff") }}>
          <AdjustBox ctx={ctx} style={{ padding: px(5.5), display: "flex", flexDirection: "column", gap: px(1.6), color: "#141024" }}>
            <Kicker ctx={ctx} color={accentColor(ctx)} />
            <Title ctx={ctx} size={6.6} color="#141024" />
          </AdjustBox>
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
              <AdditionalText ctx={ctx} size={2.4} opacity={0.55} style={{ maxWidth: "55%", textAlign: "right", marginLeft: "auto" }} />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "darkluxury",
    label: "Dark Luxury",
    tags: ["luxury", "dark", "centered"],
    render: (ctx) => {
      const { content, brand, variant } = ctx;
      return (
        <div style={{ ...base(brand), background: "#0b0810" }}>
          <Img src={content.imageDataUrl} style={{ opacity: 0.55 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0b0810 20%, rgba(11,8,16,.35) 60%, rgba(11,8,16,.75))" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: px(6.5),
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: variant.align === "center" ? "center" : "flex-start",
              textAlign: variant.align,
            }}
          >
            <BizRow ctx={ctx} tone="light" />
            <AdjustBox ctx={ctx} style={{ display: "flex", flexDirection: "column", gap: px(2.2) }}>
              <Kicker ctx={ctx} color={brand.accent} />
              <Title ctx={ctx} size={8.4} color="#f6f1ff" />
              <AdditionalText ctx={ctx} size={2.6} opacity={0.7} />
              <PriceBadge ctx={ctx} tone="light" />
            </AdjustBox>
          </div>
        </div>
      );
    },
  },
  {
    id: "lightluxury",
    label: "Light Luxury",
    tags: ["luxury", "light", "whitespace"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: bgOr(brand, "#faf7f2"), display: "flex", flexDirection: "column", padding: px(7), gap: px(4) }}>
          <BizRow ctx={ctx} tone="dark" />
          <div style={{ position: "relative", flex: 1, borderRadius: px(2), overflow: "hidden" }}>
            <Img src={content.imageDataUrl} />
          </div>
          <AdjustBox ctx={ctx} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: px(1.8) }}>
            <Kicker ctx={ctx} color={accentColor(ctx)} />
            <Title ctx={ctx} size={6.4} color="#241c30" />
            <PriceBadge ctx={ctx} tone="dark" />
          </AdjustBox>
        </div>
      );
    },
  },
  {
    id: "typeblast",
    label: "Type Blast",
    tags: ["type_first", "bold", "dark"],
    render: (ctx) => {
      const { content, brand, variant } = ctx;
      return (
        <div style={{ ...base(brand), background: `linear-gradient(155deg, ${brand.primary}, #0c0716)`, color: "#fff" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: px(6.5),
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: px(2.4),
              textAlign: variant.align,
              alignItems: variant.align === "center" ? "center" : "flex-start",
            }}
          >
            <BizRow ctx={ctx} tone="light" />
            <AdjustBox ctx={ctx} style={{ display: "flex", flexDirection: "column", gap: px(2.4) }}>
              <Kicker ctx={ctx} color={brand.accent} />
              <Title ctx={ctx} size={13} color="#fff" />
              <Chips items={metaItems(content, ctx.businessType)} tone="light" />
              <div style={{ display: "flex", gap: px(2) }}>
                <PriceBadge ctx={ctx} tone="light" />
                <CtaTag ctx={ctx} tone="light" />
              </div>
            </AdjustBox>
          </div>
        </div>
      );
    },
  },
  {
    id: "whitespacepanel",
    label: "Whitespace Panel",
    tags: ["whitespace", "minimal", "asymmetric"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: bgOr(brand, "#ffffff"), display: "flex" }}>
          <div style={{ flex: "0 0 62%", padding: px(7), display: "flex", flexDirection: "column", justifyContent: "center", gap: px(2.4) }}>
            <BizRow ctx={ctx} tone="dark" />
            <AdjustBox ctx={ctx} style={{ display: "flex", flexDirection: "column", gap: px(2.4) }}>
              <Kicker ctx={ctx} color={accentColor(ctx)} />
              <Title ctx={ctx} size={7.6} color="#181026" />
              <AdditionalText ctx={ctx} size={2.6} opacity={0.6} />
              <PriceBadge ctx={ctx} tone="dark" />
              <ContactLine ctx={ctx} tone="dark" />
            </AdjustBox>
          </div>
          <div style={{ position: "relative", flex: "0 0 38%" }}>
            <Img src={content.imageDataUrl} />
          </div>
        </div>
      );
    },
  },
  {
    id: "densegrid",
    label: "Dense Grid",
    tags: ["dense", "offer", "light"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: bgOr(brand, "#fff"), display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", flex: "0 0 40%" }}>
            <Img src={content.imageDataUrl} />
          </div>
          <AdjustBox ctx={ctx} style={{ flex: 1, padding: px(5), display: "flex", flexDirection: "column", gap: px(1.6), color: "#151020" }}>
            <div style={{ display: "flex", alignItems: "center", gap: px(2) }}>
              <Kicker ctx={ctx} color={accentColor(ctx)} />
              <span style={{ marginLeft: "auto" }}>
                <PriceBadge ctx={ctx} tone="dark" />
              </span>
            </div>
            <Title ctx={ctx} size={6} color="#151020" />
            <Chips items={[...metaItems(content, ctx.businessType), ...content.services]} tone="dark" />
            <AdditionalText ctx={ctx} size={2.4} opacity={0.6} />
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <BizRow ctx={ctx} tone="dark" />
              <CtaTag ctx={ctx} tone="dark" />
            </div>
          </AdjustBox>
        </div>
      );
    },
  },
  {
    id: "asymmetricoffer",
    label: "Asymmetric Offer",
    tags: ["asymmetric", "offer", "bold"],
    render: (ctx) => {
      const { content, brand } = ctx;
      return (
        <div style={{ ...base(brand), background: "#100a1c" }}>
          <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0, 62% 0, 46% 100%, 0 100%)" }}>
            <Img src={content.imageDataUrl} />
          </div>
          <div style={{ position: "absolute", inset: 0, padding: px(6), display: "flex", justifyContent: "flex-end" }}>
            <AdjustBox
              ctx={ctx}
              style={{ width: "56%", display: "flex", flexDirection: "column", gap: px(2.2), color: "#fff", justifyContent: "center" }}
            >
              <BizRow ctx={ctx} tone="light" />
              <Kicker ctx={ctx} color={brand.accent} />
              <Title ctx={ctx} size={7.6} color="#fff" />
              <PriceBadge ctx={ctx} tone="light" />
              <CtaTag ctx={ctx} tone="light" />
            </AdjustBox>
          </div>
        </div>
      );
    },
  },
];

export const engineIds = [...engines.map((e) => e.id), "custom"];

const engineMap = new Map(engines.map((e) => [e.id, e]));

const variants: TemplateVariant[] = [
  { align: "left", tone: "light", badge: "pill", accent: "primary" },
  { align: "center", tone: "light", badge: "square", accent: "secondary" },
  { align: "left", tone: "dark", badge: "square", accent: "accent" },
  { align: "center", tone: "dark", badge: "pill", accent: "secondary" },
];

/* ------------------------------ custom engine ------------------------------ */

const zoneFontWeight: Record<TemplateZone["weight"], number> = {
  regular: 500,
  bold: 700,
  extra: 800,
};

function zoneText(zone: TemplateZone, ctx: RenderCtx): string {
  const { content, brand } = ctx;
  switch (zone.key) {
    case "title":
      return content.title;
    case "subject":
      return content.subject;
    case "price":
      return formatPrice(content.price, brand.currency);
    case "location":
      return content.location;
    case "date":
      return content.date;
    case "services":
      return content.services.join("  ·  ");
    case "additionalText":
      return content.additionalText;
    case "cta":
      return content.cta;
    case "brandName":
      return ctx.showBrandName ? ctx.businessName : "";
    default:
      return "";
  }
}

function ZoneNode({ zone, ctx }: { zone: TemplateZone; ctx: RenderCtx }) {
  if (zone.key === "logo") {
    if (!ctx.brand.logoDataUrl) return null;
    return (
      <img
        src={ctx.brand.logoDataUrl}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          left: `${zone.x}%`,
          top: `${zone.y}%`,
          width: `${zone.width}%`,
          objectFit: "contain",
        }}
      />
    );
  }
  const text = zoneText(zone, ctx);
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        textAlign: zone.align,
        color: zone.color,
        fontWeight: zoneFontWeight[zone.weight],
        fontSize: px(zone.size),
        textTransform: zone.uppercase ? "uppercase" : "none",
        fontFamily: zone.key === "title" ? font(ctx.brand) : fontSecondary(ctx.brand),
        lineHeight: 1.2,
        whiteSpace: "pre-wrap",
      }}
    >
      {text}
    </div>
  );
}

/** Locked uploaded background, fills the canvas untouched. Only mapped zones
 * render dynamic content on top, never restyled. */
function renderCustomTemplate(template: Template, ctx: RenderCtx): React.ReactNode {
  const adjust = ctx.adjustments?.text;
  const x = clamp(adjust?.x ?? 0, -12, 12);
  const y = clamp(adjust?.y ?? 0, -12, 12);
  const scale = clamp(adjust?.scale ?? 1, 0.8, 1.25);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {template.backgroundUrl ? (
        <img
          src={template.backgroundUrl}
          alt=""
          crossOrigin="anonymous"
          style={{ position: "absolute", inset: 0, height: "100%", width: "100%", objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${x}cqw, ${y}cqw) scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        {(template.zones ?? []).map((zone) => (
          <ZoneNode key={zone.key} zone={zone} ctx={ctx} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ template names ----------------------------- */

const NAME_PARTS: [string, string][] = [
  ["Aurora", "Skyline"], ["Editorial", "Column"], ["Glass", "Reflection"], ["Split", "Horizon"],
  ["Frame", "Border"], ["Duotone", "Wash"], ["Ticket", "Stub"], ["Minimal", "Slate"],
  ["Poster", "Signal"], ["Banner", "Ridge"], ["Spotlight", "Halo"], ["Stack", "Ledger"],
  ["Dark", "Velvet"], ["Light", "Marble"], ["Type", "Impact"], ["Wide", "Panel"],
  ["Dense", "Grid"], ["Asymmetric", "Wedge"], ["Quiet", "Canvas"], ["Bold", "Statement"],
  ["Muted", "Tone"], ["Radiant", "Field"], ["Layered", "Depth"], ["Open", "Air"],
  ["Structured", "Order"], ["Fluid", "Curve"], ["Crisp", "Edge"], ["Warm", "Glow"],
  ["Cool", "Frost"], ["Sharp", "Contrast"], ["Soft", "Focus"], ["Grand", "Scale"],
  ["Refined", "Detail"], ["Vivid", "Accent"], ["Elevated", "View"], ["Balanced", "Form"],
  ["Clear", "Space"], ["Rich", "Texture"], ["Airy", "Loft"], ["Precise", "Line"],
  ["Modern", "Frame"], ["Timeless", "Story"], ["Confident", "Voice"], ["Polished", "Surface"],
  ["Curated", "Selection"], ["Signature", "Series"], ["Essential", "Look"], ["Distinct", "Edition"],
  ["Premium", "Set"], ["Standout", "Reveal"],
];

/** 50 premium global templates, tag driven, never locked to an industry. */
function buildGlobalTemplates(): Template[] {
  const out: Template[] = [];
  const total = 50;
  let i = 0;
  let engineCursor = 0;
  while (out.length < total) {
    const remaining = total - out.length;
    const enginesLeft = engines.length - engineCursor;
    const perEngine = enginesLeft > 0 ? Math.max(2, Math.round(remaining / enginesLeft)) : remaining;
    const engine = engines[engineCursor % engines.length]!;
    const count = Math.min(perEngine, remaining);
    for (let k = 0; k < count; k++) {
      const variant = variants[i % variants.length]!;
      const [a, b] = NAME_PARTS[i % NAME_PARTS.length]!;
      out.push({
        id: `global_${i + 1}`,
        name: `${a} ${b}`,
        engine: engine.id,
        tags: engine.tags,
        variant,
        scope: "global",
        businessId: null,
        archived: false,
        format: "post",
      });
      i++;
    }
    engineCursor++;
  }
  return out.slice(0, total);
}

/* --------------------------- other content formats -------------------------- */

/**
 * Representative sets for the remaining formats. They reuse the exact same
 * engines, brand data, text fit rules and adjustments as posts, only the
 * canvas shape and the format rules differ. The full library comes later.
 */
const FORMAT_ENGINES: Record<"carousel" | "video" | "story", string[]> = {
  carousel: ["aurora", "editorial", "spotlight", "darkluxury", "glass", "poster"],
  video: ["aurora", "spotlight", "darkluxury", "typeblast"],
  story: ["aurora", "glass", "darkluxury", "typeblast"],
};

const FORMAT_NAMES: Record<"carousel" | "video" | "story", string[]> = {
  carousel: ["Story Set", "Column Set", "Halo Set", "Velvet Set", "Reflection Set", "Signal Set"],
  video: ["Motion Skyline", "Motion Halo", "Motion Velvet", "Motion Impact"],
  story: ["Tall Skyline", "Tall Reflection", "Tall Velvet", "Tall Impact"],
};

function buildFormatTemplates(format: "carousel" | "video" | "story"): Template[] {
  const spec = FORMAT_SPECS[format];
  return FORMAT_ENGINES[format].map((engineId, index) => {
    const engine = engineMap.get(engineId) ?? engines[0]!;
    const variant = variants[index % variants.length]!;
    return {
      id: `${format}_${index + 1}`,
      name: FORMAT_NAMES[format][index] ?? `${engine.label} ${index + 1}`,
      engine: engine.id,
      tags: engine.tags,
      variant,
      scope: "global" as const,
      businessId: null,
      archived: false,
      format,
      slides: { min: spec.minSlides, max: spec.maxSlides, default: spec.defaultSlides },
      ...(format === "video"
        ? {
            motion: {
              minDuration: spec.minDuration,
              maxDuration: spec.maxDuration,
              defaultDuration: spec.defaultDuration,
              transition: (index % 3 === 0 ? "fade" : index % 3 === 1 ? "slide" : "zoom") as
                | "fade"
                | "slide"
                | "zoom",
            },
          }
        : {}),
    };
  });
}

export const globalTemplates: Template[] = [
  ...buildGlobalTemplates(),
  ...buildFormatTemplates("carousel"),
  ...buildFormatTemplates("video"),
  ...buildFormatTemplates("story"),
];

/** Templates available for one format. Custom uploads stay in the post format
 * unless they declare otherwise, since their design is locked to its canvas. */
export function templatesForFormat(all: Template[], format: ContentFormat): Template[] {
  return all.filter((tpl) => (tpl.format ?? "post") === format);
}


export function renderTemplate(
  template: Template,
  args: Omit<RenderCtx, "variant"> & { variant?: TemplateVariant },
): React.ReactNode {
  const variant = args.variant ?? template.variant;
  const ctx: RenderCtx = { ...args, variant };
  if (template.engine === "custom") {
    return renderCustomTemplate(template, ctx);
  }
  const engine = engineMap.get(template.engine) ?? engines[0]!;
  return engine.render(ctx);
}
