import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function yesNo(value, lang = "en") {
  if (value === "yes") return lang === "es" ? "Sí" : "Yes";
  if (value === "no") return lang === "es" ? "No" : "No";
  return "";
}

function buildHtmlEmail(payload) {
  const lang = payload?.language || "en";
  const data = payload?.data || {};
  const borrower = data.borrower || {};
  const loan = data.loan || {};
  const identity = data.identity || {};
  const housing = data.housing || {};
  const currentHousing = housing.current || {};
  const otherProperty = data.otherProperty || {};
  const credit = data.credit || {};
  const notes = data.notes || {};

  const jobs = Array.isArray(data?.employment?.jobs) ? data.employment.jobs : [];
  const debts = Array.isArray(data?.debts) ? data.debts : [];
  const assets = Array.isArray(data?.assets) ? data.assets : [];

  const clientStatus =
    borrower.clientStatus === "new"
      ? "New client"
      : borrower.clientStatus === "existing"
      ? "Existing client"
      : "";

  const realtorLine =
    borrower.hasRealtor === "yes"
      ? `<p><strong>Has realtor:</strong> Yes<br><strong>Realtor name:</strong> ${esc(
          borrower.realtorName || ""
        )}</p>`
      : `<p><strong>Has realtor:</strong> No</p>`;

  const jobsHtml = jobs.length
    ? `<ul>${jobs
        .map(
          (job) => `
        <li>
          <strong>${esc(job.type || "")}</strong> — ${esc(job.employerName || "")}<br>
          Start: ${esc(job.startDate || "")}<br>
          Current: ${esc(job.isCurrent || "")}<br>
          End: ${esc(job.endDate || "")}<br>
          Position: ${esc(job.position || "")}<br>
          Monthly income: ${esc(job.monthlyIncome || job.monthlySalary || "")}
        </li>
      `
        )
        .join("")}</ul>`
    : "<p>No jobs submitted.</p>";

  const debtsHtml = debts.some(
    (d) => d?.name || d?.balance || d?.monthlyPayment
  )
    ? `<ul>${debts
        .filter((d) => d?.name || d?.balance || d?.monthlyPayment)
        .map(
          (d) => `
        <li>
          ${esc(d.name || "")} — Balance: ${esc(d.balance || "")} — Monthly: ${esc(
            d.monthlyPayment || ""
          )}
        </li>
      `
        )
        .join("")}</ul>`
    : "<p>No debts listed.</p>";

  const assetsHtml = assets.some((a) => a?.type || a?.amount)
    ? `<ul>${assets
        .filter((a) => a?.type || a?.amount)
        .map(
          (a) => `
        <li>
          ${esc(a.type || "")} — Amount: ${esc(a.amount || "")}
        </li>
      `
        )
        .join("")}</ul>`
    : "<p>No assets listed.</p>";

  return `
    <h2>New MortgageMax Intake</h2>
    <p><strong>Submitted:</strong> ${esc(payload?.submittedAt || "")}</p>
    <p><strong>Language:</strong> ${esc(lang)}</p>

    <h3>Borrower</h3>
    <p>
      <strong>Name:</strong> ${esc(borrower.firstName || "")} ${esc(borrower.lastName || "")}<br>
      <strong>Email:</strong> ${esc(borrower.email || "")}<br>
      <strong>Phone:</strong> ${esc(borrower.phone || "")}<br>
      <strong>DOB:</strong> ${esc(borrower.dob || "")}<br>
      <strong>Marital status:</strong> ${esc(borrower.maritalStatus || "")}<br>
      <strong>Client status:</strong> ${esc(clientStatus)}
    </p>

    ${realtorLine}

    <h3>Loan</h3>
    <p>
      <strong>Intent:</strong> ${esc(loan.intent || "")}<br>
      <strong>Refi type:</strong> ${esc(loan.refiType || "")}<br>
      <strong>Occupancy:</strong> ${esc(loan.occupancy || "")}
    </p>

    <h3>Identification</h3>
    <p>
      <strong>ID type:</strong> ${esc(identity.idType || "")}<br>
      <strong>SSN status:</strong> ${esc(identity.ssnStatus || "")}<br>
      <strong>Passport valid:</strong> ${esc(identity.passportValid || "")}
    </p>

    <h3>Housing</h3>
    <p>
      <strong>Current address:</strong> ${esc(currentHousing.street || "")}, ${esc(
    currentHousing.city || ""
  )}, ${esc(currentHousing.state || "")} ${esc(currentHousing.zip || "")}<br>
      <strong>Housing type:</strong> ${esc(currentHousing.ownRent || "")}<br>
      <strong>Monthly payment:</strong> ${esc(currentHousing.monthlyPayment || "")}<br>
      <strong>Time there:</strong> ${esc(currentHousing.years || "")} years, ${esc(
    currentHousing.months || ""
  )} months
    </p>

    <p>
      <strong>Other property:</strong> ${yesNo(otherProperty.hasOther, lang)}<br>
      <strong>Other property address:</strong> ${esc(otherProperty.address || "")}<br>
      <strong>Other property status:</strong> ${esc(otherProperty.lienStatus || "")}
    </p>

    <h3>Employment</h3>
    ${jobsHtml}

    <h3>Credit</h3>
    <p>
      <strong>Has credit:</strong> ${yesNo(credit.hasCredit, lang)}<br>
      <strong>Approx score:</strong> ${esc(credit.approxScore || "")}
    </p>

    <h3>Debts</h3>
    ${debtsHtml}

    <h3>Assets / Savings</h3>
    ${assetsHtml}

    <h3>Comments</h3>
    <p>${esc(notes.clientComments || "")}</p>

    `;
  }
  //no Need
  // <h3>Raw JSON</h3>
  // <pre>${esc(JSON.stringify(data, null, 2))}</pre>
  
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body || {};
    const borrower = payload?.data?.borrower || {};
    const fullName = `${borrower.firstName || ""} ${borrower.lastName || ""}`.trim();
    const recipients = process.env.TO_EMAIL.split(",");

    const emailResult = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: recipients,
    subject: `New MortgageMax Intake${fullName ? ` - ${fullName}` : ""}`,
    html: buildHtmlEmail(payload),
    replyTo: borrower.email || undefined
    });

    if (process.env.SEND_CONFIRMATION === "true" && borrower.email) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: [borrower.email],
        subject: "We received your MortgageMax intake",
        html: `
          <h2>Thank you</h2>
          <p>We received your information and will contact you soon.</p>
          <p><strong>Name:</strong> ${esc(fullName)}</p>
        `
      });
    }

    return res.status(200).json({ ok: true, emailResult });
  } catch (error) {
    console.error("Intake error:", error);
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
}