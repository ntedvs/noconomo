import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export type EventEmailProps = {
  title: string
  date: string
  notes?: string
  senderName: string
}

export default function EventEmail({
  title,
  date,
  notes,
  senderName,
}: EventEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`New event: ${title} on ${date}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={kicker}>Noconomo · New Event</Text>
          <Heading style={h1}>{title}</Heading>
          <Section style={meta}>
            <Text style={metaLabel}>Date</Text>
            <Text style={metaValue}>{date}</Text>
          </Section>
          {notes ? (
            <Section style={meta}>
              <Text style={metaLabel}>Notes</Text>
              <Text style={metaValue}>{notes}</Text>
            </Section>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>Added by {senderName}.</Text>
        </Container>
      </Body>
    </Html>
  )
}

const SANS =
  "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const MONO = "'Geist Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"

const body: React.CSSProperties = {
  backgroundColor: "#fafafa",
  fontFamily: SANS,
  letterSpacing: "-0.005em",
  margin: 0,
  padding: "40px 0",
}
const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #eaeaea",
  borderRadius: 8,
  margin: "0 auto",
  maxWidth: 560,
  padding: "36px 40px",
}
const kicker: React.CSSProperties = {
  color: "#8f8f8f",
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.12em",
  margin: 0,
  textTransform: "uppercase",
}
const h1: React.CSSProperties = {
  color: "#000000",
  fontSize: 28,
  fontWeight: 600,
  letterSpacing: "-0.02em",
  lineHeight: 1.15,
  margin: "10px 0 28px",
}
const meta: React.CSSProperties = {
  marginBottom: 18,
}
const metaLabel: React.CSSProperties = {
  color: "#8f8f8f",
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.1em",
  margin: 0,
  textTransform: "uppercase",
}
const metaValue: React.CSSProperties = {
  color: "#000000",
  fontSize: 15,
  letterSpacing: "-0.005em",
  lineHeight: 1.5,
  margin: "4px 0 0",
  whiteSpace: "pre-wrap",
}
const hr: React.CSSProperties = {
  borderColor: "#eaeaea",
  margin: "32px 0 20px",
}
const footer: React.CSSProperties = {
  color: "#666666",
  fontSize: 13,
  margin: 0,
}
