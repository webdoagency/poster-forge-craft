import type { Brand, PostFields } from "./types";

/**
 * Deterministic template system.
 * Templates own 100% of the visual layout. AI never changes these —
 * it only produces text that flows into the placeholders below:
 * title, destination, business, price, date, services, additional_text, image, logo.
 */

export type TemplateProps = { fields: PostFields; brand: Brand };

export type Template = {
  id: string;
  name: string;
  vibe: string;
  render: (p: TemplateProps) => React.ReactNode;
};

const px = (n: number) => `${n}cqw`;

function Img({ src, className = "", style }: { src: string | null; className?: string; style?: React.CSSProperties }) {
  if (!src) return <div className={`bg-muted ${className}`} style={style} />;
  return (
    <img
      src={src}
      alt=""
      className={`h-full w-full object-cover ${className}`}
      style={style}
      crossOrigin="anonymous"
    />
  );
}

function Logo({ brand, dark = false }: { brand: Brand; dark?: boolean }) {
  if (brand.logoDataUrl) {
    return <img src={brand.logoDataUrl} alt="" style={{ height: px(7), width: "auto", objectFit: "contain" }} />;
  }
  const initials = (brand.businessName || "R")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        height: px(7),
        width: px(7),
        borderRadius: px(2),
        display: "grid",
        placeItems: "center",
        fontSize: px(2.9),
        fontWeight: 800,
        letterSpacing: "0.02em",
        color: dark ? brand.primary : "#fff",
        background: dark ? "rgba(255,255,255,0.92)" : `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`,
      }}
    >
      {initials}
    </div>
  );
}

function Chips({ items, tone }: { items: string[]; tone: "light" | "dark" }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: px(1.4) }}>
      {items.map((s) => (
        <span
          key={s}
          style={{
            fontSize: px(2.5),
            fontWeight: 600,
            padding: `${px(0.9)} ${px(2.2)}`,
            borderRadius: px(10),
            color: tone === "light" ? "#fff" : "#221"
              ,
            background: tone === "light" ? "rgba(255,255,255,0.18)" : "rgba(20,10,40,0.06)",
            border: `1px solid ${tone === "light" ? "rgba(255,255,255,0.35)" : "rgba(20,10,40,0.08)"}`,
            backdropFilter: "blur(6px)",
          }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

const font = (brand: Brand) => `"${brand.fontFamily}", "Sora", ui-sans-serif, system-ui, sans-serif`;

export const templates: Template[] = [
  {
    id: "aurora",
    name: "Aurora",
    vibe: "Full-bleed image, gradient scrim",
    render: ({ fields, brand }) => (
      <div style={{ position: "absolute", inset: 0, fontFamily: font(brand), color: "#fff" }}>
        <Img src={fields.imageDataUrl} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${brand.primary}f2 4%, ${brand.primary}55 38%, transparent 66%)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: px(6) }}>
          <div style={{ display: "flex", alignItems: "center", gap: px(2.4) }}>
            <Logo brand={brand} />
            <span style={{ fontSize: px(3), fontWeight: 700, textShadow: "0 1px 12px rgba(0,0,0,.35)" }}>
              {fields.business || brand.businessName}
            </span>
            {fields.date ? (
              <span style={{ marginLeft: "auto", fontSize: px(2.5), fontWeight: 600, padding: `${px(1)} ${px(2.4)}`, borderRadius: px(10), background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}>
                {fields.date}
              </span>
            ) : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: px(2.4) }}>
            {fields.destination ? (
              <span style={{ fontSize: px(2.9), fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.92 }}>
                {fields.destination}
              </span>
            ) : null}
            <h2 style={{ fontSize: px(9.6), lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
              {fields.title || "Your headline here"}
            </h2>
            {fields.additionalText ? (
              <p style={{ margin: 0, fontSize: px(3), opacity: 0.9, lineHeight: 1.35 }}>{fields.additionalText}</p>
            ) : null}
            <Chips items={fields.services} tone="light" />
            {fields.price ? (
              <div style={{ marginTop: px(1), alignSelf: "flex-start", padding: `${px(1.8)} ${px(3.6)}`, borderRadius: px(10), background: "#fff", color: brand.primary, fontWeight: 800, fontSize: px(4.2) }}>
                {fields.price}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "editorial",
    name: "Editorial",
    vibe: "Image top, clean type panel",
    render: ({ fields, brand }) => (
      <div style={{ position: "absolute", inset: 0, fontFamily: font(brand), background: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", flex: "0 0 60%", overflow: "hidden" }}>
          <Img src={fields.imageDataUrl} />
          {fields.date ? (
            <span style={{ position: "absolute", top: px(5), left: px(5), fontSize: px(2.5), fontWeight: 700, color: "#fff", padding: `${px(1)} ${px(2.4)}`, borderRadius: px(10), background: "rgba(0,0,0,0.28)", backdropFilter: "blur(8px)" }}>
              {fields.date}
            </span>
          ) : null}
        </div>
        <div style={{ flex: 1, padding: px(6), display: "flex", flexDirection: "column", gap: px(2.2), color: "#1a1225" }}>
          <div style={{ display: "flex", alignItems: "center", gap: px(2) }}>
            <span style={{ width: px(7), height: px(0.7), background: `linear-gradient(90deg, ${brand.primary}, ${brand.secondary})`, borderRadius: px(1) }} />
            <span style={{ fontSize: px(2.5), fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: brand.primary }}>
              {fields.destination || brand.businessName}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: px(7.6), lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {fields.title || "Your headline here"}
          </h2>
          {fields.additionalText ? (
            <p style={{ margin: 0, fontSize: px(2.9), lineHeight: 1.4, opacity: 0.66 }}>{fields.additionalText}</p>
          ) : null}
          <Chips items={fields.services} tone="dark" />
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: px(2.4) }}>
            <Logo brand={brand} dark />
            <span style={{ fontSize: px(2.8), fontWeight: 700 }}>{fields.business || brand.businessName}</span>
            {fields.price ? (
              <span style={{ marginLeft: "auto", fontSize: px(4.4), fontWeight: 800, color: brand.primary }}>{fields.price}</span>
            ) : null}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "glass",
    name: "Glass",
    vibe: "Blurred backdrop, glass card",
    render: ({ fields, brand }) => (
      <div style={{ position: "absolute", inset: 0, fontFamily: font(brand), overflow: "hidden", background: brand.primary }}>
        <Img src={fields.imageDataUrl} style={{ filter: "blur(2px) saturate(115%)", transform: "scale(1.08)" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${brand.primary}88, ${brand.secondary}88)` }} />
        <div style={{ position: "absolute", inset: 0, padding: px(6), display: "flex", flexDirection: "column", gap: px(4) }}>
          <div style={{ display: "flex", alignItems: "center", gap: px(2.4), color: "#fff" }}>
            <Logo brand={brand} dark />
            <span style={{ fontSize: px(3), fontWeight: 700 }}>{fields.business || brand.businessName}</span>
          </div>
          <div style={{ position: "relative", flex: 1, borderRadius: px(5), overflow: "hidden", boxShadow: "0 30px 60px -30px rgba(0,0,0,.5)" }}>
            <Img src={fields.imageDataUrl} />
          </div>
          <div
            style={{
              borderRadius: px(5),
              padding: px(4.5),
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(255,255,255,0.6)",
              backdropFilter: "blur(20px)",
              color: "#181026",
              display: "flex",
              flexDirection: "column",
              gap: px(1.8),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: px(2) }}>
              {fields.destination ? (
                <span style={{ fontSize: px(2.4), fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: brand.primary }}>
                  {fields.destination}
                </span>
              ) : null}
              {fields.date ? <span style={{ fontSize: px(2.4), fontWeight: 600, opacity: 0.55 }}>· {fields.date}</span> : null}
              {fields.price ? (
                <span style={{ marginLeft: "auto", fontSize: px(4), fontWeight: 800, color: brand.primary }}>{fields.price}</span>
              ) : null}
            </div>
            <h2 style={{ margin: 0, fontSize: px(6.4), lineHeight: 1.06, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {fields.title || "Your headline here"}
            </h2>
            {fields.additionalText ? (
              <p style={{ margin: 0, fontSize: px(2.7), lineHeight: 1.4, opacity: 0.65 }}>{fields.additionalText}</p>
            ) : null}
            <Chips items={fields.services} tone="dark" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "split",
    name: "Split",
    vibe: "Bold gradient panel + image",
    render: ({ fields, brand }) => (
      <div style={{ position: "absolute", inset: 0, fontFamily: font(brand), display: "flex", flexDirection: "column", background: "#fff" }}>
        <div
          style={{
            flex: "0 0 52%",
            background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`,
            color: "#fff",
            padding: px(6),
            display: "flex",
            flexDirection: "column",
            gap: px(2.2),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: px(2.4) }}>
            <Logo brand={brand} dark />
            <span style={{ fontSize: px(2.9), fontWeight: 700 }}>{fields.business || brand.businessName}</span>
            {fields.price ? (
              <span style={{ marginLeft: "auto", fontSize: px(2.7), fontWeight: 800, padding: `${px(1.1)} ${px(2.6)}`, borderRadius: px(10), background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" }}>
                {fields.price}
              </span>
            ) : null}
          </div>
          <h2 style={{ margin: `${px(1)} 0 0`, fontSize: px(8.6), lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.035em" }}>
            {fields.title || "Your headline here"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: px(2), fontSize: px(2.7), fontWeight: 600, opacity: 0.92 }}>
            {fields.destination ? <span>{fields.destination}</span> : null}
            {fields.destination && fields.date ? <span>·</span> : null}
            {fields.date ? <span>{fields.date}</span> : null}
          </div>
          <div style={{ marginTop: "auto" }}>
            <Chips items={fields.services} tone="light" />
          </div>
        </div>
        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          <Img src={fields.imageDataUrl} />
          {fields.additionalText ? (
            <div
              style={{
                position: "absolute",
                left: px(5),
                right: px(5),
                bottom: px(5),
                padding: `${px(2.2)} ${px(3)}`,
                borderRadius: px(3.4),
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(16px)",
                color: "#181026",
                fontSize: px(2.7),
                fontWeight: 600,
              }}
            >
              {fields.additionalText}
            </div>
          ) : null}
        </div>
      </div>
    ),
  },
  {
    id: "frame",
    name: "Frame",
    vibe: "Minimal white frame, centered",
    render: ({ fields, brand }) => (
      <div style={{ position: "absolute", inset: 0, fontFamily: font(brand), background: "#fbfaff", padding: px(5), display: "flex", flexDirection: "column", gap: px(3.4) }}>
        <div style={{ position: "relative", flex: "0 0 56%", borderRadius: px(4), overflow: "hidden" }}>
          <Img src={fields.imageDataUrl} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${brand.primary}4d, transparent 55%)` }} />
          {fields.price ? (
            <span style={{ position: "absolute", right: px(4), top: px(4), fontSize: px(3.4), fontWeight: 800, color: "#fff", padding: `${px(1.2)} ${px(2.8)}`, borderRadius: px(10), background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})` }}>
              {fields.price}
            </span>
          ) : null}
        </div>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: px(2), color: "#181026" }}>
          <span style={{ fontSize: px(2.4), fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: brand.primary }}>
            {[fields.destination, fields.date].filter(Boolean).join(" · ") || brand.businessName}
          </span>
          <h2 style={{ margin: 0, fontSize: px(7), lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {fields.title || "Your headline here"}
          </h2>
          {fields.additionalText ? (
            <p style={{ margin: 0, fontSize: px(2.7), lineHeight: 1.4, opacity: 0.62, maxWidth: "80%" }}>{fields.additionalText}</p>
          ) : null}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Chips items={fields.services} tone="dark" />
          </div>
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: px(2) }}>
          <Logo brand={brand} dark />
          <span style={{ fontSize: px(2.7), fontWeight: 700, color: "#181026" }}>{fields.business || brand.businessName}</span>
        </div>
      </div>
    ),
  },
];

export const getTemplate = (id: string) => templates.find((t) => t.id === id) ?? templates[0]!;
